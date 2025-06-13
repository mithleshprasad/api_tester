# API Tester

A web-based API testing tool built with HTML, CSS, and JavaScript. This tool allows users to compose and send HTTP requests, view responses, manage headers, body, authentication, and track request history — all from a clean and responsive interface.

## 🚀 Features

* Support for common HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
* Custom headers with dynamic form
* Request body editor with JSON formatting
* Authentication options:

  * No Auth
  * Basic Auth
  * Bearer Token
  * API Key (query or header)
* Syntax-highlighted JSON response viewer
* Response metadata: status, time, size
* Tabbed views for body, headers, cookies
* Request history (stored in `localStorage`)
* Import/export of requests (Save/Import buttons)

## 🛠️ Installation

No build tools required! This is a static web app.

### Option 1: Open Locally

1. Clone the repository or copy the code.
2. Save the HTML as `index.html`.
3. Open it in any modern web browser.

### Option 2: Use a Live Server

For auto-refresh and local hosting:

```bash
npx serve
# or
python3 -m http.server
```

Then visit `http://localhost:5000` or whatever port it provides.

## 📋 How to Use

1. **Choose HTTP Method** (GET, POST, etc.)
2. **Enter API Endpoint URL**
3. **Add Headers (optional)**:

   * Click **"Add Header"**
   * Provide key/value (e.g., `Content-Type: application/json`)
4. **Set Body (if applicable)**:

   * Switch to the **Body** tab
   * Add raw JSON, XML, or plain text
5. **Add Auth (optional)**:

   * Switch to the **Auth** tab
   * Select Basic, Bearer Token, or API Key
6. **Send Request**:

   * Click **"Send"**
   * View response in the bottom panel
   * Switch between **Body**, **Headers**, and **Cookies**
7. **Track History**:

   * Left sidebar shows past requests
   * Click to reload

## 💾 Save/Import Requests

* **Save**: Stores history to `localStorage`
* **Import**: Future enhancement (can be extended to support JSON import/export)

## 📂 File Structure

```text
index.html       # All-in-one HTML, CSS, JS
README.md        # Project documentation
```

## 🧩 Customization Ideas

* Add dark mode
* Support for GraphQL
* Curl export for requests
* File upload support in body

## 🛡️ Browser Compatibility

✅ Chrome
✅ Firefox
✅ Edge
✅ Safari

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
