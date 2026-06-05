const express = require('express');
const cors = require('cors');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/tovar', (req, res) => {
  const sql = `
    SELECT Tovar.*, Kategoriya.Nazvanie as Kategoriya_Nazvanie, Brend.Naimenovanie as Brend_Naimenovanie, Model.Naimenovanie as Model_Naimenovanie
    FROM Tovar
    LEFT JOIN Kategoriya ON Tovar.ID_Kategorii = Kategoriya.ID_Kategorii
    LEFT JOIN Brend ON Tovar.ID_Brenda = Brend.ID_Brenda
    LEFT JOIN Model ON Tovar.ID_Modeli = Model.ID_Modeli
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/zakaz', (req, res) => {
  const { id_polzovatelya, status_fk, items } = req.body;
  const dataZakaza = new Date().toISOString();

  db.run(
    `INSERT INTO Zakaz (Data_zakaza, Status_FK, ID_Polzovatelya_FK) VALUES (?, ?, ?)`,
    [dataZakaza, status_fk, id_polzovatelya],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const zakazId = this.lastID;
      
      const stmt = db.prepare(`INSERT INTO Soderzhimoe (ID_Zakaza_FK, ID_Tovara_FK, Summa, Kolvo_tovara) VALUES (?, ?, ?, ?)`);
      
      items.forEach(item => {
        stmt.run(zakazId, item.id_tovara, item.summa, item.kolvo);
      });
      
      stmt.finalize();

      res.json({ message: "Заказ успешно создан", zakazId: zakazId });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/Main.html`);
});