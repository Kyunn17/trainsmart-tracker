---
sidebar_position: 1
---

# Reviews API

API untuk mengelola review game.

## POST /api/reviews

Endpoint ini digunakan untuk membuat review baru.

### Request

Client harus mengirim data berupa JSON.

```json
{
  "nama": "Budi",
  "review": "Game-nya bagus"
}
```

### Response

Jika berhasil:

#### 201 Created

```json
{
    "message": "review berhasil dibuat"
}
```

### Error

Jika Gagal:

#### 400 Bad Request
```json
{
    "message" : "nama dan review wajib diisi"
}
```

