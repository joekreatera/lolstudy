from databases import Database
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float
from dotenv import load_dotenv

secret = os.getenv("POSTGRES_CONN")


database = Database(DB_URL)
metadata = MetaData()

books = Table (
  "books",
  metadata,
  Column("id", Integer, primary_key=True, index=True),
  Column("title", String, index=True),
  Column("author", String, index=True),
  Column("price", Float),
)

engine = create_engine(DB_URL)
metadata.create_all(engine)
