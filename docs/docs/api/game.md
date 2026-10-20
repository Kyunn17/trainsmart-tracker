---
sidebar_position : 1
---

# Game API

API untuk menambahkan game baru

## POST/ api/games

Endpoint yang digunakan untuk menambahkan game baru

### Request

Client mengirim data berbentuk JSON

```json
{
  "title": "Minecraft",
  "genre": "Sandbox",
  "developer": "Mojang"
}
```

### Response

Jika berhasil:

#### 201 Created

```json
{
  "message": "Game berhasil ditambahkan",
  "data": {
    "title": "Minecraft",
    "genre": "Sandbox",
    "developer": "Mojang"
  }
}
```

### Error 
Jika gagal :
#### 400 Bad Request

```json
{
"message": "Semua field wajib diisi"
}
```
