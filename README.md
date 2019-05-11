# orders
AXA IM - Orders manager.

## Requirements

- Node.js version 10 or higher
- [MySQL v8](https://www.mysql.com/fr/) database.

## Getting Started

First, clone (with git) and install the project with npm
```bash
$ git clone https://github.com/UIM-Community/orders.git
$ cd orders
$ npm ci
```

Then, you must create a file named `.env` at the root to configure the project.
```bash
$ touch .env
```

Add these environment variables and save them, you can change the values ​​of these keys according to your needs
```js
api_http_port=1337
api_http_ssl=false
db_host=localhost
db_user=
db_password="NimSoft!01"
db_database=ca_uim_cmdb
```

### SSL Configuration
To enable SSL, enable the configuration key `api_http_ssl` to **true** (in the .env file).

Then create a SSL directory that will contain your **key** and **cert** file:
- key.pem
- cert.pem

## Endpoints

### /view
Single Page Application endpoint (the interface).

## License
MIT
