# 🧾 Invoicr

**Invoicr** is a modern web app for freelancers to track working time, manage invoices, and export them as PDF — all with a beautiful, glowing gradient UI.

Built with **Vite**, **React**, **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features

- ⏱️ Track working time (auto with timer or manual entry)
- 💰 Set hourly rates per project
- 🧮 Auto-calculates billable totals
- 📄 Generate and export invoices as PDF
- 💾 Save & load project data locally (no sign-up required)
- 🌗 Light/Dark mode switch
- 🌈 Rainbow gradient glow UI (inspired by Vercel/Linear)

---

## 📦 Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF) or [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)
- **State Management**: React Context or Zustand (depending on implementation)
- **Persistence**: localStorage or IndexedDB

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/JessenReinhart/invoicr.git
cd invoicr
````

### 2. Install dependencies

```bash
npm install
# or
yarn
```

### 3. Start the dev server

```bash
npm run dev
```

App should now be running at: [http://localhost:5173](http://localhost:5173)

---

## 🛠 Build for Production

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```
src/
│
├── assets/            # Icons, images, branding
├── components/        # Shared React components
├── pages/             # Page-level components
├── store/             # Global state management
├── utils/             # Helper functions
├── hooks/             # Custom React hooks
├── App.tsx
└── main.tsx
```

---

## 🔒 License

MIT © [Your Name](https://github.com/JessenReinhart)

---

## 🙏 Acknowledgements

Inspired by the sleek design systems of:

* [Vercel](https://vercel.com/)
* [Linear](https://linear.app/)
* [Raycast](https://raycast.com/)
* [Superlist](https://superlist.com/)

