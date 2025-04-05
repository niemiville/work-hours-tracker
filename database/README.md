# Docker Commands for PostgreSQL Database

## Start and Stop Database

(On Windows, maybe use docker-compose instead)

- **Start the database in the background:**
  ```sh
  docker compose up -d
  ```

- **Stop the database (keep data):**
  ```sh
  docker compose down
  ```

- **Restart the database:**
  ```sh
  docker compose up -d
  ```

## Remove Database

- **Remove container but keep data:**
  ```sh
  docker compose down
  ```

- **Remove everything (including data):**
  ```sh
  docker compose down -v
  ```

## Database Access

- **Connect to PostgreSQL CLI:**
  ```sh
  docker exec -it work-hours-db-toshiba psql -U toshiba -d workhours
  ```
  ```sh
  docker exec -it work-hours-db psql -U user -d workhours
  ```

## Container Management

- **Check running containers:**
  ```sh
  docker ps
  ```

- **View PostgreSQL logs:**
  ```sh
  docker logs work-hours-db
  ```

- **Restart the database container:**
  ```sh
  docker restart work-hours-db
  ```
