# SmartSchool testUI

Vanilla JavaScript frontend connected to the current Django REST backend.

## Run

```powershell
cd D:\PythonFiles\smartschool\testUI
npm install
npm start
```

Open the URL printed by `servor` and keep the Django backend running on `http://127.0.0.1:8000`.

## API config

Edit `js/config.js` if the backend runs on a different address.

```js
window.SMARTSCHOOL_CONFIG = {
  apiBaseUrl: "http://127.0.0.1:8000",
  dashboardLimit: 0
};
```
