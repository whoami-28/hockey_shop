const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./hockey_store.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Polzovatel (
    ID_Polzovatelya INTEGER PRIMARY KEY AUTOINCREMENT,
    FIO TEXT NOT NULL,
    Telefon TEXT,
    Email TEXT,
    Adres TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Administrator (
    ID_Administratora INTEGER PRIMARY KEY AUTOINCREMENT,
    FIO TEXT NOT NULL,
    Telefon TEXT,
    Email TEXT,
    Reestr_prav_dostupa TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Status (
    ID_Statusa INTEGER PRIMARY KEY AUTOINCREMENT,
    Sostoyanie_zakaza TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Brend (
    ID_Brenda INTEGER PRIMARY KEY AUTOINCREMENT,
    Naimenovanie TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Kategoriya (
    ID_Kategorii INTEGER PRIMARY KEY AUTOINCREMENT,
    Nazvanie TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Model (
    ID_Modeli INTEGER PRIMARY KEY AUTOINCREMENT,
    Naimenovanie TEXT NOT NULL,
    Harakteristiki TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Tovar (
    ID_Tovara INTEGER PRIMARY KEY AUTOINCREMENT,
    Naimenovanie TEXT NOT NULL,
    ID_Kategorii INTEGER,
    ID_Brenda INTEGER,
    ID_Modeli INTEGER,
    Razmer TEXT,
    Cena REAL,
    Kolichestvo INTEGER,
    FOREIGN KEY (ID_Kategorii) REFERENCES Kategoriya(ID_Kategorii),
    FOREIGN KEY (ID_Brenda) REFERENCES Brend(ID_Brenda),
    FOREIGN KEY (ID_Modeli) REFERENCES Model(ID_Modeli)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Zakaz (
    ID_Zakaza INTEGER PRIMARY KEY AUTOINCREMENT,
    Data_zakaza TEXT,
    Status_FK INTEGER,
    ID_Polzovatelya_FK INTEGER,
    FOREIGN KEY (Status_FK) REFERENCES Status(ID_Statusa),
    FOREIGN KEY (ID_Polzovatelya_FK) REFERENCES Polzovatel(ID_Polzovatelya)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Soderzhimoe (
    ID_Soderzhimogo INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Zakaza_FK INTEGER,
    ID_Tovara_FK INTEGER,
    Summa REAL,
    Kolvo_tovara INTEGER,
    FOREIGN KEY (ID_Zakaza_FK) REFERENCES Zakaz(ID_Zakaza),
    FOREIGN KEY (ID_Tovara_FK) REFERENCES Tovar(ID_Tovara)
  )`);
});

module.exports = db;