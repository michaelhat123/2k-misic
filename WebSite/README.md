# 2K Music Website 🎵

Official website for 2K Music - Your Ultimate Music Streaming Companion

## 🚀 Features

- **Modern Design**: Beautiful, responsive design with animated backgrounds
- **Fast Performance**: Built with Next.js 14 and optimized for speed
- **Branded Experience**: Consistent branding with the 2K Music app
- **Comprehensive Pages**: Home, About, Features, Download, Contact, Privacy Policy, and Terms of Service

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3002`

## 📁 Project Structure

```
site/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── about/              # About page
│   ├── features/           # Features page
│   ├── download/           # Download page
│   ├── contact/            # Contact page
│   ├── privacy/            # Privacy Policy
│   ├── terms/              # Terms of Service
│   └── globals.css         # Global styles
├── components/
│   ├── AnimatedBackground.tsx
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── Loader.tsx
├── public/                 # Static assets
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## 🎨 Customization

### Colors
The site uses the same color scheme as the 2K Music app:
- Primary: `#00bfff` (Cyan/Blue)
- Secondary: `#1a1a2e` (Dark Blue)
- Accent: `#e94560` (Pink/Red)

### Branding
- Logo and branding elements are in `/components`
- Update the logo in `Navigation.tsx` and `Footer.tsx`

## 🚢 Deployment

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
npm start
```

### Deploy to Vercel:
```bash
vercel
```

## 📄 Pages

- **/** - Homepage with hero section and features
- **/about** - Company information and values
- **/features** - Detailed feature list
- **/download** - Download links for all platforms
- **/contact** - Contact form and information
- **/privacy** - Privacy Policy
- **/terms** - Terms of Service

## 🎯 TODO

- [ ] Add real download links
- [ ] Implement contact form backend
- [ ] Add FAQ page
- [ ] Add blog section
- [ ] Integrate analytics
- [ ] Add SEO meta tags
- [ ] Set up sitemap
- [ ] Add social media integration

## 📝 License

Copyright © 2024 2K Music. All rights reserved.

## 🤝 Support

For support, email support@2kmusic.com
