const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hockey_store.db');

const categories = ['Коньки', 'Клюшки', 'Защита', 'Шлемы', 'Вратарь', 'Одежда'];
const brands = ['BAUER', 'CCM', 'WARRIOR', 'TRUE', 'SHERWOOD'];
const statuses = ['Новый', 'В обработке', 'Отправлен', 'Доставлен', 'Отменен'];

const models = [
    { name: 'Vapor Hyperlite 2', desc: 'Элитный уровень, сверхлегкий карбон' },
    { name: 'Nexus Sync', desc: 'Профессиональный уровень, ER Spine' },
    { name: 'Jetspeed FT6 Pro', desc: 'Гибридная точка прогиба' },
    { name: 'Ribcor Trigger 8 Pro', desc: 'Оптимизированный нижний прогиб' },
    { name: 'Alpha LX2 Pro', desc: 'Универсальная клюшка, Sabre Taper' },
    { name: 'Covert QR5 Pro', desc: 'Максимально резкий бросок' }
];

const sizes = {
    'Клюшки': ['70 Flex', '77 Flex', '85 Flex']
};

db.serialize(() => {
    console.log('🔄 Пересоздание структуры базы данных...');
    
    // Принудительное удаление старых таблиц (решает проблему кэшированной схемы)
    db.run('DROP TABLE IF EXISTS Soderzhimoe');
    db.run('DROP TABLE IF EXISTS Zakaz');
    db.run('DROP TABLE IF EXISTS Tovar');
    db.run('DROP TABLE IF EXISTS Model');
    db.run('DROP TABLE IF EXISTS Kategoriya');
    db.run('DROP TABLE IF EXISTS Brend');
    db.run('DROP TABLE IF EXISTS Status');
    db.run('DROP TABLE IF EXISTS Polzovatel');
    db.run('DROP TABLE IF EXISTS Administrator');

    // Создание актуальных таблиц
    db.run(`CREATE TABLE Polzovatel (ID_Polzovatelya INTEGER PRIMARY KEY AUTOINCREMENT, FIO TEXT, Telefon TEXT, Email TEXT, Adres TEXT)`);
    db.run(`CREATE TABLE Status (ID_Statusa INTEGER PRIMARY KEY AUTOINCREMENT, Sostoyanie_zakaza TEXT)`);
    db.run(`CREATE TABLE Kategoriya (ID_Kategorii INTEGER PRIMARY KEY AUTOINCREMENT, Nazvanie TEXT)`);
    db.run(`CREATE TABLE Brend (ID_Brenda INTEGER PRIMARY KEY AUTOINCREMENT, Naimenovanie TEXT)`);
    db.run(`CREATE TABLE Model (ID_Modeli INTEGER PRIMARY KEY AUTOINCREMENT, Naimenovanie TEXT, Harakteristiki TEXT)`);
    db.run(`CREATE TABLE Tovar (ID_Tovara INTEGER PRIMARY KEY AUTOINCREMENT, Naimenovanie TEXT, ID_Kategorii INTEGER, ID_Brenda INTEGER, ID_Modeli INTEGER, Razmer TEXT, Cena REAL, Kolichestvo INTEGER)`);
    db.run(`CREATE TABLE Zakaz (ID_Zakaza INTEGER PRIMARY KEY AUTOINCREMENT, Data_zakaza TEXT, Status_FK INTEGER, ID_Polzovatelya_FK INTEGER)`);
    db.run(`CREATE TABLE Soderzhimoe (ID_Soderzhimogo INTEGER PRIMARY KEY AUTOINCREMENT, ID_Zakaza_FK INTEGER, ID_Tovara_FK INTEGER, Summa REAL, Kolvo_tovara INTEGER)`);

    console.log('✅ Таблицы созданы. Заполнение данными...');

    // 1. Статусы
    const stmtStatus = db.prepare('INSERT INTO Status (Sostoyanie_zakaza) VALUES (?)');
    statuses.forEach(s => stmtStatus.run(s));
    stmtStatus.finalize();

    // 2. Тестовый пользователь
    db.run(`INSERT INTO Polzovatel (FIO, Telefon, Email, Adres) VALUES ('Тестовый Клиент', '+375291112233', 'test@test.by', 'г. Минск')`);

    // 3. Категории, бренды, модели
    const stmtCat = db.prepare('INSERT INTO Kategoriya (Nazvanie) VALUES (?)');
    categories.forEach(cat => stmtCat.run(cat));
    stmtCat.finalize();

    const stmtBrand = db.prepare('INSERT INTO Brend (Naimenovanie) VALUES (?)');
    brands.forEach(brand => stmtBrand.run(brand));
    stmtBrand.finalize();

    const stmtModel = db.prepare('INSERT INTO Model (Naimenovanie, Harakteristiki) VALUES (?, ?)');
    models.forEach(model => stmtModel.run(model.name, model.desc));
    stmtModel.finalize();

    // 4. Товары
    const stmtTovar = db.prepare(`INSERT INTO Tovar (Naimenovanie, ID_Kategorii, ID_Brenda, ID_Modeli, Razmer, Cena, Kolichestvo) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    let productsCount = 0;
    models.forEach((model, idx) => {
        sizes['Клюшки'].forEach(size => {
            stmtTovar.run(`Клюшка ${model.name}`, 2, (idx % 4) + 1, idx + 1, size, 850 + (idx * 50), 10);
            productsCount++;
        });
    });
    stmtTovar.finalize(() => {
        console.log(`✅ Готово! Сгенерировано ${productsCount} товаров.`);
        console.log('🚀 Теперь запустите сервер командой: npm start');
    });
});