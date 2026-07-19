# Detalles de instalacion
El servidor tiene las siguientes características:
1. 1 CPU Virtual
2. Disco SSD 128 GB
3. Servidor Nginx configurado para http y https (certbot y lets encrypt) ruteado hacia el puerto 8000 


# Settings de la base de datos
La instalación tiene Postgres server 16 configurado con un usuario root con password. 
Existe un usuario para una base de datos de prueba, pero pueden agregarse más. 

## Agregar BBDD y usuarios a la base de datos

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

# Conectarse a la instancia:
Para controlar el servidor se ha habilitado el ssh:
```
 ssh -i .\lolstdudy deployer@147.182.138.128
```
La clave se ha hecho llegar a partir de los canales de comunicación.

# Acceder a la sesión
El servidor tiene instalada la utilidad "screen" para mantener activa la sesión. Para entrar en ella:
```
screen -x 13650.pts-0.lolstudy-main ssh -i .\lolstdudy deployer@147.182.138.128
```
Con lo que se verá la salida del servidor. Para parar el servidor se puede ejecutar *CTRL+C*

# Salir de la sesión screen
Para salir de la sesión al finalizar los trabajos, es importante presionar *CTRL+A+D*

Bajo esta combinación se tendrá acceso a la pantalla ssh principal donde es posible salir con el comando exit. 

### Nota:  Si se teclea el comando exit adentro de la sesión de screen se terminarán todos los procesos. Para volver a correr todo, ver apartado de Nueva aplicación. 

# Correr aplicación actualizada

Actualmente se encuentra corriendo una aplicación asociada a este github. Utiliza FastAPI como mecanismo principal (con uvicorn):

```
uvicorn main:app --host 0.0.0.0 --port 8000
```

Al hacer *CTRL+C* se detiene la aplicación y la terminal se encontrará en el ambiente virtual de python (virtualenv python 3.12). A partir de este punto es posible instalar con el comando 
```
pip install <paquete> 
```

Una vez que el git haya sido actualizado con nuevo código, verificar la ubicación de la carpeta 
```
/home/deployer/lolstudy
```

Con lo que es posible ejecutar:
```
git pull origin main
```

Una vez hecho esto, la aplicación puede ser comenzada de nuevo siempre y cuando el archivo principal sea "main.py". 
```
uvicorn main:app --host 0.0.0.0 --port 8000
```

# Nueva aplicación (solo en caso de reset o pérdida de configuración)
Ya sea que exista una nueva sesión de screen o que se haya reseteado el ambiente virtual, se pueden ejecutar los siguientes pasos:
Comando screen 
```
screen
```
Si ya se tenía acceso a la sesión de screen, el mismo sistema NO dejará crear una subsesión. 

Acceso a carpeta de ambiente:
```
cd /home/deployer/lolstudy
```

Inicialización del ambiente configurado
```
source ./env/bin/activate
```
Establecimiento de cualquier variable de entorno para acceso con dotenv de python
```
export VAR="value"
```
Con lo que es posible acceder a la variable desde python
```python
import os
v = os.getenv("VAR")
```
Actualmente así está configurado el acceso al URL de conexión en el servidor. 

# Mejores prácticas
1. No colocar passwords de bases de datos ni conexiones en este git
2. Utilizar ssh con las claves proporcionadas a través de los medios de comunicación

