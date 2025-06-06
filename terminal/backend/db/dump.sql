CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

INSERT INTO empresas VALUES(1,'Flota Rionegro');
INSERT INTO empresas VALUES(2,'Expreso gomezvilla');
INSERT INTO empresas VALUES(3,'Rapido Duitama');
INSERT INTO empresas VALUES(4,'Transportes Reina');
INSERT INTO empresas VALUES(5,'Expreso Brasilia');
INSERT INTO empresas VALUES(6,'Omega');
INSERT INTO empresas VALUES(7,'Expreso Gaviota');
INSERT INTO empresas VALUES(8,'Copetran');
INSERT INTO empresas VALUES(9,'Concorde');
INSERT INTO empresas VALUES(10,'Libertadores');
INSERT INTO empresas VALUES(11,'Valle De Tenza');
INSERT INTO empresas VALUES(12,'Flota La Macarena');
INSERT INTO empresas VALUES(13,'Alianza');
INSERT INTO empresas VALUES(14,'Berlinas Del Fonce');
INSERT INTO empresas VALUES(15,'Rapido El Carmen');
INSERT INTO empresas VALUES(16,'Flota Boyaca');
INSERT INTO empresas VALUES(17,'Expreso Paz Del Rio');
INSERT INTO empresas VALUES(18,'Los Delfines');
INSERT INTO empresas VALUES(19,'Cotrans');
INSERT INTO empresas VALUES(20,'Flota Aguila');
INSERT INTO empresas VALUES(21,'Tisquesusa');
INSERT INTO empresas VALUES(22,'Expreso Comuneros');
INSERT INTO empresas VALUES(23,'Arizona');
INSERT INTO empresas VALUES(24,'Transportes reina');
INSERT INTO empresas VALUES(25,'Cootranszipa');

CREATE TABLE buses (
    id SERIAL PRIMARY KEY,
    numero_bus TEXT NOT NULL UNIQUE,
    conductor TEXT NOT NULL,
    empresa_id INTEGER NOT NULL,
    cat_asientos INTEGER NOT NULL DEFAULT 40,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

INSERT INTO buses VALUES(1,'con-001','Juan Sanchez',9,35);
INSERT INTO buses VALUES(2,'con-002','Haider Espinosa',9,35);
INSERT INTO buses VALUES(3,'con-003','Snatiago Chavez',8,40);
INSERT INTO buses VALUES(4,'lib-001','Emanuel Villarez',10,45);
INSERT INTO buses VALUES(5,'lib-002','Julian Gomez',10,40);
INSERT INTO buses VALUES(6,'lib-003','Juan Rodriguez',10,40);
INSERT INTO buses VALUES(7,'lib-004','Snatiago Gimenez',10,40);
INSERT INTO buses VALUES(8,'lib-005','Jaider Ramirez',10,40);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

INSERT INTO roles VALUES(1,'usuario');
INSERT INTO roles VALUES(2,'agencias');
INSERT INTO roles VALUES(3,'admin');

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL,
    rol_id INTEGER,
    verificado INTEGER DEFAULT 0,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
);

INSERT INTO usuarios VALUES(1,'Nuevo Usuario','nuevousuario@example.com','$2b$10$8Jbvq1Yg6er8uOBkOAzxE.6VRYiRLZwwvQ/OkxklMge8nK785/UDS',3,0);
INSERT INTO usuarios VALUES(2,'haider','haider@gmail.com','$2b$10$0xrUzHP4iRA6MANXNRmAv.ntrXNXz99LNgu8/pgr7FTpphM9SdJ6u',3,0);
INSERT INTO usuarios VALUES(3,'test','test@gmail.com','$2b$10$jAjhFoI5nGPETq6.yossYuVLfG0DNRmnO0vL0dEfk8yT/RUWzwShy',1,1);
INSERT INTO usuarios VALUES(4,'Andres Felipe','gonzalezgarzon14@hotmail.com','$2b$10$D1BfAzK8Wovu0MyHwMEwWOZJQ1OBAuXIkDM7nJ1Byt1xt0Gg18QxC',3,1);
INSERT INTO usuarios VALUES(5,'Cuca','pene@pene.edu.co','$2b$10$corqy57GQmWCQD9IWR5DkOFOWp/MJaYM/vFJrmiz8pcBuEZM9J8Ze',3,0);
INSERT INTO usuarios VALUES(6,'Haider andres','haiderandres1369@gmail.com','$2b$10$qpBhsDnmLx2NorZFxJnjkOuCiOOg.St0nVRetVDpiAtcr0fr2cUY6',3,1);
INSERT INTO usuarios VALUES(7,'Haider Canon','2004haidercanon@gmail.com','123',1,1);

CREATE TABLE municipios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    tarifa_km REAL NOT NULL DEFAULT 1.0
);

INSERT INTO municipios VALUES(1,'Terminal satélite norte',1.0);
INSERT INTO municipios VALUES(2,'Bogotá',1.0);
INSERT INTO municipios VALUES(3,'Chía',1.0);
INSERT INTO municipios VALUES(4,'Tocancipí',1.0);
INSERT INTO municipios VALUES(5,'El Sisga',1.0);
INSERT INTO municipios VALUES(6,'Guateque',1.0);
INSERT INTO municipios VALUES(7,'Sabanalarga',1.0);
INSERT INTO municipios VALUES(8,'Monterrey',1.0);
INSERT INTO municipios VALUES(9,'Tauramena',1.0);
INSERT INTO municipios VALUES(10,'Aguazul',1.0);
INSERT INTO municipios VALUES(11,'Aguazul, Casanare',1.0);
INSERT INTO municipios VALUES(17,'Paipa',1.0);
INSERT INTO municipios VALUES(18,'Duitama',1.0);
INSERT INTO municipios VALUES(19,'Sogamoso',1.0);

CREATE TABLE rutas (
    id SERIAL PRIMARY KEY,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    distancia_km REAL,
    duracion_estimada TEXT
);

INSERT INTO rutas VALUES(1,'Terminal satélite norte','Aguazul, Casanare',321.0,'6 h 18 m');
INSERT INTO rutas VALUES(2,'Terminal satélite norte','Sogamoso',201.0,'3 h 20 m');

CREATE TABLE viajes (
    id SERIAL PRIMARY KEY,
    bus_id INTEGER NOT NULL,
    ruta_id INTEGER NOT NULL,
    salida TEXT NOT NULL,
    llegada TEXT NOT NULL,
    precio INTEGER,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
);

INSERT INTO viajes VALUES(1,1,1,'2025-05-29T21:30','2025-05-30T05:30',81000);
INSERT INTO viajes VALUES(2,2,1,'2025-05-30T04:00','2025-05-30T12:00',81000);
INSERT INTO viajes VALUES(3,3,1,'2025-05-29T11:20','2025-05-29T19:20',81000);
INSERT INTO viajes VALUES(4,4,2,'2025-05-29T11:00','2025-05-29T14:20',45000);
INSERT INTO viajes VALUES(5,5,2,'2025-05-29T12:00','2025-05-29T15:00',45000);
INSERT INTO viajes VALUES(6,6,2,'2025-05-29T12:30','2025-05-29T15:50',45000);
INSERT INTO viajes VALUES(7,8,2,'2025-05-29T13:00','2025-05-29T16:20',45000);
INSERT INTO viajes VALUES(8,7,2,'2025-05-29T16:05','2025-05-29T19:25',45000);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    viaje_id INTEGER NOT NULL,
    asiento TEXT NOT NULL,
    fecha_compra TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
);

CREATE TABLE ruta_municipios (
    id SERIAL PRIMARY KEY,
    ruta_id INTEGER NOT NULL,
    municipio_id INTEGER NOT NULL,
    orden INTEGER,
    FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
    FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE CASCADE,
    UNIQUE (ruta_id, municipio_id)
);

INSERT INTO ruta_municipios VALUES(923,1,1,0);
INSERT INTO ruta_municipios VALUES(924,1,2,1);
INSERT INTO ruta_municipios VALUES(925,1,3,2);
INSERT INTO ruta_municipios VALUES(926,1,4,3);
INSERT INTO ruta_municipios VALUES(927,1,5,4);
INSERT INTO ruta_municipios VALUES(928,1,6,5);
INSERT INTO ruta_municipios VALUES(929,1,7,6);
INSERT INTO ruta_municipios VALUES(930,1,8,7);
INSERT INTO ruta_municipios VALUES(931,1,9,8);
INSERT INTO ruta_municipios VALUES(932,1,10,9);
INSERT INTO ruta_municipios VALUES(933,1,11,10);
INSERT INTO ruta_municipios VALUES(934,2,1,0);
INSERT INTO ruta_municipios VALUES(935,2,2,1);
INSERT INTO ruta_municipios VALUES(936,2,3,2);
INSERT INTO ruta_municipios VALUES(937,2,4,3);
INSERT INTO ruta_municipios VALUES(938,2,5,4);
INSERT INTO ruta_municipios VALUES(939,2,17,5);
INSERT INTO ruta_municipios VALUES(940,2,18,6);
INSERT INTO ruta_municipios VALUES(941,2,19,7);
