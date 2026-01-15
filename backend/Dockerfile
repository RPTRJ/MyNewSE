# ==============================================================================
# Backend Dockerfile - Go Application
# ==============================================================================

FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build main server
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

# Build seed tool
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o seed ./cmd/seed

# ==============================================================================
# Production Image
# ==============================================================================
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

ENV TZ=Asia/Bangkok

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/seed .

RUN mkdir -p /app/uploads

EXPOSE 8080

CMD ["./server"]