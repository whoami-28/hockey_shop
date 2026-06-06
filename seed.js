const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./hockey_store.db');

const categories = ['Коньки', 'Клюшки', 'Защита', 'Шлемы', 'Вратарь', 'Одежда'];
const brands = ['BAUER', 'CCM', 'WARRIOR', 'TRUE', 'SHERWOOD'];
const statuses = ['Новый', 'В обработке', 'Отправлен', 'Доставлен', 'Отменен'];

const models = [
    { c: 2, n: 'Vapor Hyperlite 2', h: 'Элитный уровень, нижняя точка прогиба' },
    { c: 2, n: 'Nexus Sync', h: 'Средняя точка прогиба, ER Spine' },
    { c: 2, n: 'Jetspeed FT6 Pro', h: 'Гибридная точка прогиба' },
    { c: 2, n: 'Ribcor Trigger 8 Pro', h: 'Нижняя точка прогиба' },
    { c: 2, n: 'Alpha LX2 Pro', h: 'Универсальная клюшка' },
    { c: 1, n: 'Supreme Mach', h: 'Жесткий ботинок, максимальная передача энергии' },
    { c: 1, n: 'Tacks XF Pro', h: 'Монолитный ботинок' },
    { c: 1, n: 'Vapor X5 Pro', h: 'Легкость и маневренность' },
    { c: 3, n: 'Supreme M5 Pro', h: 'Максимальная защита' },
    { c: 3, n: 'JetSpeed FT6', h: 'Облегченная защита' },
    { c: 3, n: 'Alpha LX Pro', h: 'Свобода движений' },
    { c: 4, n: 'Re-Akt 150', h: 'Идеальная посадка' },
    { c: 4, n: 'Super Tacks X', h: 'Технология 3D печати D3O' },
    { c: 5, n: 'Vapor Hyperlite 2 Goalie', h: 'Ультралегкие щитки вратаря' },
    { c: 5, n: 'EFLEX 6', h: 'Гибкость и контроль' },
    { c: 6, n: 'Pro Training Hoodie', h: 'Дышащий материал' },
    { c: 6, n: 'Locker Room Suit', h: 'Удобный спортивный костюм' }
];

const sizes = {
    1: ['7.0 D', '7.5 D', '8.0 D', '8.5 EE', '9.0 D', '10.0 D', '11.0 EE'],
    2: ['70 Flex', '77 Flex', '85 Flex', '95 Flex', '105 Flex'],
    3: ['Junior L', 'Senior S', 'Senior M', 'Senior L', 'Senior XL'],
    4: ['Small', 'Medium', 'Large'],
    5: ['32+1', '33+1', '34+1', '35+2'],
    6: ['S', 'M', 'L', 'XL', 'XXL']
};

db.serialize(() => {
    db.run('DROP TABLE IF EXISTS Soderzhimoe');
    db.run('DROP TABLE IF EXISTS Zakaz');
    db.run('DROP TABLE IF EXISTS Tovar');
    db.run('DROP TABLE IF EXISTS Model');
    db.run('DROP TABLE IF EXISTS Kategoriya');
    db.run('DROP TABLE IF EXISTS Brend');
    db.run('DROP TABLE IF EXISTS Status');
    db.run('DROP TABLE IF EXISTS Polzovatel');
    db.run('DROP TABLE IF EXISTS Administrator');

    db.run(`CREATE TABLE Polzovatel (ID_Polzovatelya INTEGER PRIMARY KEY AUTOINCREMENT, FIO TEXT, Telefon TEXT, Email TEXT UNIQUE, Adres TEXT, Parol TEXT)`);
    db.run(`CREATE TABLE Status (ID_Statusa INTEGER PRIMARY KEY AUTOINCREMENT, Sostoyanie_zakaza TEXT)`);
    db.run(`CREATE TABLE Kategoriya (ID_Kategorii INTEGER PRIMARY KEY AUTOINCREMENT, Nazvanie TEXT)`);
    db.run(`CREATE TABLE Brend (ID_Brenda INTEGER PRIMARY KEY AUTOINCREMENT, Naimenovanie TEXT)`);
    db.run(`CREATE TABLE Model (ID_Modeli INTEGER PRIMARY KEY AUTOINCREMENT, Naimenovanie TEXT, Harakteristiki TEXT)`);
    db.run(`CREATE TABLE Tovar (ID_Tovara INTEGER PRIMARY KEY AUTOINCREMENT, Naimenovanie TEXT, ID_Kategorii INTEGER, ID_Brenda INTEGER, ID_Modeli INTEGER, Razmer TEXT, Cena REAL, Kolichestvo INTEGER)`);
    db.run(`CREATE TABLE Zakaz (ID_Zakaza INTEGER PRIMARY KEY AUTOINCREMENT, Data_zakaza TEXT, Status_FK INTEGER, ID_Polzovatelya_FK INTEGER)`);
    db.run(`CREATE TABLE Soderzhimoe (ID_Soderzhimogo INTEGER PRIMARY KEY AUTOINCREMENT, ID_Zakaza_FK INTEGER, ID_Tovara_FK INTEGER, Summa REAL, Kolvo_tovara INTEGER)`);

    const stmtStatus = db.prepare('INSERT INTO Status (Sostoyanie_zakaza) VALUES (?)');
    statuses.forEach(s => stmtStatus.run(s));
    stmtStatus.finalize();

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('123456', salt);
    db.run(`INSERT INTO Polzovatel (FIO, Telefon, Email, Adres, Parol) VALUES ('Тестовый Клиент', '+375291112233', 'test@test.by', 'г. Минск', '${hash}')`);

    const stmtCat = db.prepare('INSERT INTO Kategoriya (Nazvanie) VALUES (?)');
    categories.forEach(cat => stmtCat.run(cat));
    stmtCat.finalize();

    const stmtBrand = db.prepare('INSERT INTO Brend (Naimenovanie) VALUES (?)');
    brands.forEach(brand => stmtBrand.run(brand));
    stmtBrand.finalize();

    const stmtModel = db.prepare('INSERT INTO Model (Naimenovanie, Harakteristiki) VALUES (?, ?)');
    models.forEach(model => stmtModel.run(model.n, model.h));
    stmtModel.finalize();

    const stmtTovar = db.prepare(`INSERT INTO Tovar (Naimenovanie, ID_Kategorii, ID_Brenda, ID_Modeli, Razmer, Cena, Kolichestvo) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    models.forEach((model, idx) => {
        const brandId = (idx % 5) + 1;
        const modelId = idx + 1;
        const catId = model.c;
        const itemSizes = sizes[catId];
        const basePrice = catId === 1 ? 1500 : catId === 2 ? 800 : catId === 3 ? 500 : catId === 4 ? 600 : catId === 5 ? 3000 : 150;
        const catNames = {1: 'Коньки', 2: 'Клюшка', 3: 'Защита', 4: 'Шлем', 5: 'Вратарские щитки', 6: 'Костюм'};

        itemSizes.forEach(size => {
            const price = basePrice + Math.floor(Math.random() * 300);
            const qty = Math.floor(Math.random() * 15);
            stmtTovar.run(`${catNames[catId]} ${model.n}`, catId, brandId, modelId, size, price, qty);
        });
    });
    stmtTovar.finalize(() => {
        console.log('Seed completed successfully');
    });
});