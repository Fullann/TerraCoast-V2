# Utilise l'image officielle de PostgreSQL
FROM postgres:13

# Définir les variables d'environnement pour configurer PostgreSQL
ENV POSTGRES_DB terracoast_db
ENV POSTGRES_USER terracoast_user
ENV POSTGRES_PASSWORD terracoast_password


COPY ./sql/createDB.sql /docker-entrypoint-initdb.d/
