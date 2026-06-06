const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'powerplay-super-secret-key';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/register', async (req, res) => {
  const { fio, email, phone, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    db.run(
      `INSERT INTO Polzovatel (FIO, Email, Telefon, Parol) VALUES (?, ?, ?, ?)`,
      [fio, email, phone, hash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email уже используется' });
          return res.status(500).json({ error: err.message });
        }
        const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM Polzovatel WHERE Email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const isMatch = await bcrypt.compare(password, user.Parol);
    if (!isMatch) return res.status(400).json({ error: "Неверный пароль" });

    const token = jwt.sign({ id: user.ID_Polzovatelya }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  });
});

app.get('/api/user/me', authenticateToken, (req, res) => {
  db.get(
    `SELECT ID_Polzovatelya, FIO, Email, Telefon, Adres FROM Polzovatel WHERE ID_Polzovatelya = ?`, 
    [req.user.id], 
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Пользователь не найден" });
      res.json(row);
    }
  );
});

app.get('/api/user/orders', authenticateToken, (req, res) => {
  const sql = `
    SELECT z.ID_Zakaza, z.Data_zakaza, s.Sostoyanie_zakaza, SUM(sod.Summa) as TotalSum
    FROM Zakaz z
    LEFT JOIN Status s ON z.Status_FK = s.ID_Statusa
    LEFT JOIN Soderzhimoe sod ON z.ID_Zakaza = sod.ID_Zakaza_FK
    WHERE z.ID_Polzovatelya_FK = ?
    GROUP BY z.ID_Zakaza
    ORDER BY z.Data_zakaza DESC
  `;
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/tovar', (req, res) => {
  const sql = `
    SELECT Tovar.*, Kategoriya.Nazvanie as Kategoriya_Nazvanie, Brend.Naimenovanie as Brend_Naimenovanie, Model.Naimenovanie as Model_Naimenovanie
    FROM Tovar
    LEFT JOIN Kategoriya ON Tovar.ID_Kategorii = Kategoriya.ID_Kategorii
    LEFT JOIN Brend ON Tovar.ID_Brenda = Brend.ID_Brenda
    LEFT JOIN Model ON Tovar.ID_Modeli = Model.ID_Modeli
    ORDER BY Tovar.ID_Tovara DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/tovar/:id', (req, res) => {
  const sql = `
    SELECT Tovar.*, Kategoriya.Nazvanie as Kategoriya_Nazvanie, Brend.Naimenovanie as Brend_Naimenovanie, Model.Naimenovanie as Model_Naimenovanie, Model.Harakteristiki
    FROM Tovar
    LEFT JOIN Kategoriya ON Tovar.ID_Kategorii = Kategoriya.ID_Kategorii
    LEFT JOIN Brend ON Tovar.ID_Brenda = Brend.ID_Brenda
    LEFT JOIN Model ON Tovar.ID_Modeli = Model.ID_Modeli
    WHERE Tovar.ID_Tovara = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Товар не найден" });
    res.json(row);
  });
});

app.post('/api/tovar', (req, res) => {
  const { Naimenovanie, Cena, Kolichestvo, Razmer } = req.body;
  db.run(
    `INSERT INTO Tovar (Naimenovanie, ID_Kategorii, ID_Brenda, ID_Modeli, Razmer, Cena, Kolichestvo) VALUES (?, 1, 1, 1, ?, ?, ?)`,
    [Naimenovanie, Razmer, Cena, Kolichestvo],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/api/admin/products/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM Tovar WHERE ID_Tovara = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Товар удален", changes: this.changes });
  });
});

app.post('/api/zakaz', authenticateToken, (req, res) => {
  const { status_fk, items } = req.body;
  const dataZakaza = new Date().toISOString();

  db.run(
    `INSERT INTO Zakaz (Data_zakaza, Status_FK, ID_Polzovatelya_FK) VALUES (?, ?, ?)`,
    [dataZakaza, status_fk, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const zakazId = this.lastID;
      const stmt = db.prepare(`INSERT INTO Soderzhimoe (ID_Zakaza_FK, ID_Tovara_FK, Summa, Kolvo_tovara) VALUES (?, ?, ?, ?)`);
      items.forEach(item => stmt.run(zakazId, item.id_tovara, item.summa, item.kolvo));
      stmt.finalize();
      res.json({ message: "Заказ успешно создан", zakazId: zakazId });
    }
  );
});

app.get('/api/admin/orders', (req, res) => {
  const sql = `
    SELECT z.ID_Zakaza, z.Data_zakaza, z.Status_FK, s.Sostoyanie_zakaza, p.FIO, SUM(sod.Summa) as TotalSum
    FROM Zakaz z
    LEFT JOIN Status s ON z.Status_FK = s.ID_Statusa
    LEFT JOIN Polzovatel p ON z.ID_Polzovatelya_FK = p.ID_Polzovatelya
    LEFT JOIN Soderzhimoe sod ON z.ID_Zakaza = sod.ID_Zakaza_FK
    GROUP BY z.ID_Zakaza
    ORDER BY z.Data_zakaza DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/orders/:id', (req, res) => {
  const sql = `
    SELECT s.Summa, s.Kolvo_tovara, t.Naimenovanie 
    FROM Soderzhimoe s
    JOIN Tovar t ON s.ID_Tovara_FK = t.ID_Tovara
    WHERE s.ID_Zakaza_FK = ?
  `;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/admin/orders/:id/status', (req, res) => {
  const { status_id } = req.body;
  db.run(`UPDATE Zakaz SET Status_FK = ? WHERE ID_Zakaza = ?`, [status_id, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/admin/clients', (req, res) => {
  db.all(`SELECT * FROM Polzovatel ORDER BY ID_Polzovatelya DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});