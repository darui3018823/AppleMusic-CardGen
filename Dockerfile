FROM golang:1.27.3 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY server.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /applemusiccg .

FROM gcr.io/distroless/static-debian12:nonroot
# The server resolves index.html, css/ and js/ relative to its working directory.
WORKDIR /app
COPY --from=build /applemusiccg /app/applemusiccg
COPY index.html /app/
COPY css /app/css
COPY js /app/js
ENTRYPOINT ["/app/applemusiccg"]
