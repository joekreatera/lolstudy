# Detalles de instalacion
El servidor tiene las siguientes características:
2. 1 CPU Virtual
3. Disco SSD 128 GB

# Settings de la base de datos
La instalación tiene Postgres server 16 configurado con un usuario root con password. 
Existe un usuario para una base de datos de prueba, pero pueden agregarse más. 

## Agregar usuarios a la base de datos

``` 
sudo -u postgres psql
CREATE DATABASE <user_db>;
CREATE ROLE <username> WITH PASSWORD '<password>';
GRANT ALL PRIVILEGES ON DATABASE <user_db> TO <username>;

\c <user_db>
books=# GRANT USAGE ON SCHEMA public TO <username>;
GRANT
books=# GRANT CREATE ON SCHEMA public TO <username>;
GRANT
```

# Correr la nueva aplicación

