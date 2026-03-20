# 1. Etapa de Construcción (Usamos una imagen con Go instalado)
FROM golang:1.23-alpine AS builder

# Nos movemos a una carpeta de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias de la carpeta backend
COPY backend/go.mod backend/go.sum ./

# Descargamos las librerías
RUN go mod download

# Copiamos el código fuente
COPY backend/ .

# Compilamos la aplicación a un ejecutable llamado "server"
RUN go build -o server main.go

# ---------------------------------------------------------

# 2. Etapa de Ejecución (Usamos una imagen vacía y ligera de Alpine Linux)
FROM alpine:latest

WORKDIR /root/

# Copiamos solo el ejecutable que creamos antes (tiramos el código fuente a la basura)
COPY --from=builder /app/server .

# IMPORTANTE: Copiamos también la llave (para que funcione igual que en local por ahora)
# Nota: En un entorno real ideal se usan Secret Manager, pero para esta práctica esto funciona.
COPY backend/llavesBd.json .

# Exponemos el puerto 8080
EXPOSE 8080

# Comando para arrancar la app
CMD ["./server"]