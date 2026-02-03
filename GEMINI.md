# Project: transp-calc

## Project Overview

`transp-calc` is a web-based shipping calculator designed for Georgian users. It helps calculate the total cost of importing goods, including shipping fees, customs duties (VAT), and other charges. The application is a Progressive Web App (PWA), allowing it to be "installed" on a user's device for an app-like experience.

The frontend is built with HTML, Tailwind CSS for styling, and vanilla JavaScript for the application logic. It fetches the USD to GEL exchange rate from an external API (`https://v6.exchangerate-api.com`).

The main features include:
- Calculating shipping costs based on weight and dimensions (volumetric weight).
- Support for multiple shipping companies with pre-defined rates.
- Option to set a custom shipping rate.
- Automatic calculation of Georgian VAT (18%) for items over 300 GEL.
- Saving calculation history to the browser's local storage.
- A "share" feature to copy a summary of the calculation.

## Building and Running

This is a static web project with no build process. To run the project, you can simply open the `index.html` file in a web browser.

For a more realistic development environment that supports the PWA features (like service workers) and the exchange rate API, it's recommended to use a simple local web server.

### Using a local web server (optional):

1.  Make sure you have Node.js installed.
2.  Open your terminal in the `transp-calc` directory.
3.  Install a simple server package like `http-server`:
    ```bash
    npm install -g http-server
    ```
4.  Start the server:
    ```bash
    http-server
    ```
5.  Open your browser and navigate to the local address provided by the server (usually `http://localhost:8080`).

## Development Conventions

- **Styling:** The project uses [Tailwind CSS](https://tailwindcss.com/) for styling, configured directly in the `index.html` file.
- **JavaScript:** The application logic is written in vanilla JavaScript and is located in `script.js` and `list.js`.
- **PWA:** The application is a Progressive Web App, with the configuration in `manifest.json` and a service worker in `sw.js`.
- **Code Style:** The code is not formatted with any particular linter or formatter. It is recommended to use a tool like Prettier to ensure consistent formatting.
- **API Keys:** The exchange rate API key is hardcoded in `script.js`. For a production application, this should be moved to a secure, server-side environment.
- **Dependencies:** The project has no external dependencies that need to be installed via a package manager like npm or yarn. All dependencies (Tailwind CSS) are loaded via a CDN.
