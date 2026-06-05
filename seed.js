const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hockey_store.db');

// Исходные данные для генерации
const categories = ['Коньки', 'Клюшки', 'Защита', 'Шлемы', 'Вратарь', 'Одежда'];
const brands = ['BAUER', 'CCM', 'WARRIOR', 'TRUE', 'SHERWOOD'];

const models = [
    { name: 'Vapor Hyperlite 2', desc: 'Элитный уровень, нижняя точка прогиба, сверхлегкий карбон' },
    { name: 'Nexus Sync', desc: 'Профессиональный уровень, средняя точка прогиба, ER Spine' },
    { name: 'Jetspeed FT6 Pro', desc: 'Гибридная точка прогиба, технология Skeleton+' },
    { name: 'Ribcor Trigger 8 Pro', desc: 'Оптимизированный нижний прогиб, асимметричный шафт' },
    { name: 'Alpha LX2 Pro', desc: 'Универсальная клюшка, саблевидный конус Sabre Taper' },
    { name: 'Covert QR5 Pro', desc: 'Максимально резкий бросок, геометрия Edge Taper' },
    { name: 'Catalyst 9X3', desc: 'Продвинутая точность, технология смолы PLD' },
    { name: 'Rekker Legend Pro', desc: 'Легкость и надежность, двойной карбон' },
    { name: 'Supreme Mach', desc: 'Жесткий ботинок, максимальная передача энергии (коньки)' },
    { name: 'Tacks XF Pro', desc: 'Анатомическая посадка, монолитный ботинок (коньки)' },
    { name: 'Re-Akt 150', desc: 'Шлем с независимой системой регулировки FreeForm' },
    { name: 'Super Tacks X', desc: 'Шлем с технологией 3D печати D3O' }
];

const sizes = {
    'Клюшки': ['70 Flex / Левый', '70 Flex / Правый', '77 Flex / Левый', '77 Flex / Правый', '85 Flex / Левый', '85 Flex / Правый', '95 Flex / Левый'],
    'Коньки': ['7.0 D', '7.5 D', '8.0 D', '8.5 EE', '9.0 D', '9.5 EE', '10.0 D', '10.5 D', '11.0 EE'],
    'Шлемы': ['Small', 'Medium', 'Large'],
    'Защита': ['Junior L', 'Senior S', 'Senior M', 'Senior L', 'Senior XL'],
    'Одежда': ['S', 'M', 'L', 'XL', 'XXL']
};

db.serialize(() => {
    console.log('Очистка старых данных...');
    db.run('DELETE FROM Soderzhimoe');
    db.run('DELETE FROM Zakaz');
    db.run('DELETE FROM Tovar');
    db.run('DELETE FROM Model');
    db.run('DELETE FROM Brend');
    db.run('DELETE FROM Kategoriya');

    // Сброс автоинкремента
    db.run('DELETE FROM sqlite_sequence');

    console.log('Заполнение категорий...');
    const stmtCat = db.prepare('INSERT INTO Kategoriya (Nazvanie) VALUES (?)');
    categories.forEach(cat => stmtCat.run(cat));
    stmtCat.finalize();

    console.log('Заполнение брендов...');
    const stmtBrand = db.prepare('INSERT INTO Brend (Naimenovanie) VALUES (?)');
    brands.forEach(brand => stmtBrand.run(brand));
    stmtBrand.finalize();

    console.log('Заполнение моделей...');
    const stmtModel = db.prepare('INSERT INTO Model (Naimenovanie, Harakteristiki) VALUES (?, ?)');
    models.forEach(model => stmtModel.run(model.name, model.desc));
    stmtModel.finalize();

    console.log('Генерация товаров...');
    const stmtTovar = db.prepare(`
        INSERT INTO Tovar (Naimenovanie, ID_Kategorii, ID_Brenda, ID_Modeli, Razmer, Cena, Kolichestvo) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Генерация случайных товаров на основе матриц размеров
    let productsCount = 0;

    // Генерируем клюшки (Категория 2)
    models.slice(0, 8).forEach((model, modelIndex) => {
        let brandId = (modelIndex % 4) + 1; // Распределяем по брендам
        sizes['Клюшки'].forEach(size => {
            let price = Math.floor(Math.random() * (1200 - 600 + 1) + 600); // Цена от 600 до 1200 BYN
            let qty = Math.floor(Math.random() * 20); // Кол-во от 0 до 19
            stmtTovar.run(`Клюшка ${model.name}`, 2, brandId, modelIndex + 1, size, price, qty);
            productsCount++;
        });
    });

    // Генерируем коньки (Категория 1)
    models.slice(8, 10).forEach((model, modelIndex) => {
        let brandId = modelIndex === 0 ? 1 : 2; // Bauer или CCM
        sizes['Коньки'].forEach(size => {
            let price = Math.floor(Math.random() * (3500 - 1500 + 1) + 1500); // Цена от 1500 до 3500 BYN
            let qty = Math.floor(Math.random() * 10);
            stmtTovar.run(`Коньки ${model.name}`, 1, brandId, modelIndex + 9, size, price, qty);
            productsCount++;
        });
    });

    // Генерируем шлемы (Категория 4)
    models.slice(10, 12).forEach((model, modelIndex) => {
        let brandId = modelIndex === 0 ? 1 : 2; 
        sizes['Шлемы'].forEach(size => {
            let price = Math.floor(Math.random() * (900 - 400 + 1) + 400); 
            let qty = Math.floor(Math.random() * 15);
            stmtTovar.run(`Шлем ${model.name}`, 4, brandId, modelIndex + 11, size, price, qty);
            productsCount++;
        });
    });

    stmtTovar.finalize(() => {
        console.log(`✅ База данных успешно заполнена! Создано ${productsCount} уникальных товаров (с учетом размеров).`);
    });
});