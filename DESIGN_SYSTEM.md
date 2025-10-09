# 🎨 Visa Direct SDK Design System

## 📊 **Design System Overview**

**Purpose**: Unified design system for consistent user experience across all Visa Direct SDK applications  
**Scope**: Landing Page, Dashboard, and Mintlify Documentation  
**Framework**: Tailwind CSS + shadcn/ui + Lucide Icons  
**Typography**: Fintech-forward sans fonts  

---

## 🎯 **Design System Principles**

### **Core Principles**
1. **Consistency**: Same patterns across all applications
2. **Scalability**: Easy to extend and maintain
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Performance**: Optimized for fast loading
5. **Developer Experience**: Easy to implement and use

### **Visual Identity**
- **Professional**: Enterprise-grade fintech aesthetic
- **Modern**: Clean, contemporary design
- **Trustworthy**: Secure, reliable appearance
- **Accessible**: High contrast, readable typography

---

## 🎨 **Color System**

### **Primary Colors**
```css
/* Primary Brand Colors */
--primary: 37 99 235;        /* Blue 600 - #2563eb */
--primary-foreground: 255 255 255; /* White */

/* Primary Variants */
--primary-50: 239 246 255;   /* Light blue */
--primary-100: 219 234 254;  /* Lighter blue */
--primary-200: 191 219 254;  /* Light blue */
--primary-300: 147 197 253;  /* Medium light blue */
--primary-400: 96 165 250;   /* Medium blue */
--primary-500: 59 130 246;   /* Medium dark blue */
--primary-600: 37 99 235;    /* Primary blue */
--primary-700: 29 78 216;    /* Dark blue */
--primary-800: 30 64 175;    /* Darker blue */
--primary-900: 30 58 138;    /* Darkest blue */
```

### **Semantic Colors**
```css
/* Success Colors */
--success: 34 197 94;        /* Green 600 - #22c55e */
--success-foreground: 255 255 255;
--success-50: 240 253 244;
--success-100: 220 252 231;
--success-500: 34 197 94;
--success-600: 22 163 74;
--success-700: 21 128 61;

/* Error Colors */
--error: 239 68 68;          /* Red 500 - #ef4444 */
--error-foreground: 255 255 255;
--error-50: 254 242 242;
--error-100: 254 226 226;
--error-500: 239 68 68;
--error-600: 220 38 38;
--error-700: 185 28 28;

/* Warning Colors */
--warning: 245 158 11;       /* Amber 500 - #f59e0b */
--warning-foreground: 0 0 0;
--warning-50: 255 251 235;
--warning-100: 254 243 199;
--warning-500: 245 158 11;
--warning-600: 217 119 6;
--warning-700: 180 83 9;

/* Info Colors */
--info: 59 130 246;          /* Blue 500 - #3b82f6 */
--info-foreground: 255 255 255;
--info-50: 239 246 255;
--info-100: 219 234 254;
--info-500: 59 130 246;
--info-600: 37 99 235;
--info-700: 29 78 216;
```

### **Neutral Colors**
```css
/* Background Colors */
--background: 15 23 42;      /* Slate 900 - #0f172a */
--foreground: 248 250 252;   /* Slate 50 - #f8fafc */

/* Card Colors */
--card: 30 41 59;            /* Slate 800 - #1e293b */
--card-foreground: 248 250 252;

/* Muted Colors */
--muted: 51 65 85;           /* Slate 700 - #334155 */
--muted-foreground: 148 163 184; /* Slate 400 - #94a3b8 */

/* Border Colors */
--border: 51 65 85;          /* Slate 700 - #334155 */
--input: 51 65 85;
--ring: 59 130 246;          /* Blue 500 - #3b82f6 */
```

### **Gradient System**
```css
/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%);
--gradient-card: linear-gradient(135deg, #1e293b 0%, #334155 100%);
--gradient-button: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);

/* Status Gradients */
--gradient-success: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
--gradient-error: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
--gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
```

---

## 📝 **Typography System**

### **Font Family**
```css
/* Primary Font - Inter (Fintech-forward) */
--font-inter: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace Font - JetBrains Mono (Code) */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### **Font Sizes & Hierarchy**
```css
/* Display Sizes */
--text-display-2xl: 4.5rem;    /* 72px - Hero headings */
--text-display-xl: 3.75rem;    /* 60px - Large headings */
--text-display-lg: 3rem;       /* 48px - Section headings */

/* Heading Sizes */
--text-h1: 2.25rem;            /* 36px - Page titles */
--text-h2: 1.875rem;           /* 30px - Section headers */
--text-h3: 1.5rem;             /* 24px - Subsection headers */
--text-h4: 1.25rem;            /* 20px - Card titles */
--text-h5: 1.125rem;           /* 18px - Small headings */
--text-h6: 1rem;               /* 16px - Micro headings */

/* Body Sizes */
--text-body-xl: 1.25rem;       /* 20px - Large body */
--text-body-lg: 1.125rem;      /* 18px - Body text */
--text-body: 1rem;             /* 16px - Default body */
--text-body-sm: 0.875rem;      /* 14px - Small body */
--text-body-xs: 0.75rem;       /* 12px - Micro text */

/* Code Sizes */
--text-code-lg: 1.125rem;      /* 18px - Large code */
--text-code: 0.875rem;         /* 14px - Default code */
--text-code-sm: 0.75rem;       /* 12px - Small code */
```

### **Font Weights**
```css
--font-thin: 100;
--font-extralight: 200;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### **Line Heights**
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## 🧩 **Component System**

### **Button Components**
```typescript
// Primary Button
<Button variant="default" size="lg">
  Primary Action
</Button>

// Secondary Button
<Button variant="outline" size="lg">
  Secondary Action
</Button>

// Ghost Button
<Button variant="ghost" size="lg">
  Tertiary Action
</Button>

// Danger Button
<Button variant="destructive" size="lg">
  Delete Action
</Button>
```

### **Card Components**
```typescript
// Basic Card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>

// Metric Card
<Card className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">Metric Name</p>
      <p className="text-2xl font-bold">Value</p>
    </div>
    <Icon className="h-8 w-8 text-muted-foreground" />
  </div>
</Card>
```

### **Badge Components**
```typescript
// Status Badges
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>

// Status Indicators
<Badge className="bg-green-500/10 text-green-600 border-green-500/20">
  <CheckCircle2 className="h-3 w-3 mr-1" />
  Success
</Badge>
```

### **Form Components**
```typescript
// Input Field
<Input 
  placeholder="Enter value"
  className="w-full"
/>

// Select Field
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>

// Textarea
<Textarea 
  placeholder="Enter description"
  className="w-full"
/>
```

---

## 📐 **Layout System**

### **Container System**
```css
/* Container Sizes */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Spacing Scale */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

### **Grid System**
```css
/* Grid Layouts */
.grid-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

/* Responsive Grid */
.grid-responsive {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

---

## 🎯 **Application-Specific Adaptations**

### **Landing Page**
```css
/* Landing Page Specific */
.landing-hero {
  background: var(--gradient-primary);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.landing-cta {
  background: var(--gradient-button);
  color: white;
  padding: 1rem 3rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.landing-cta:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

### **Dashboard**
```css
/* Dashboard Specific */
.dashboard-sidebar {
  width: 16rem;
  background: var(--card);
  border-right: 1px solid var(--border);
}

.dashboard-header {
  height: 4rem;
  background: var(--background);
  border-bottom: 1px solid var(--border);
}

.dashboard-content {
  padding: 1.5rem;
  background: var(--background);
}

.dashboard-metric-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
}
```

### **Mintlify Documentation**
```css
/* Documentation Specific */
.docs-sidebar {
  width: 20rem;
  background: var(--card);
  border-right: 1px solid var(--border);
}

.docs-content {
  max-width: 65ch;
  margin: 0 auto;
  padding: 2rem;
}

.docs-code-block {
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: var(--font-mono);
}
```

---

## 🔧 **Implementation Guide**

### **1. Install Dependencies**
```bash
# Core dependencies
npm install tailwindcss @tailwindcss/typography
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog
npm install @radix-ui/react-avatar @radix-ui/react-button
npm install @radix-ui/react-card @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-form
npm install @radix-ui/react-input @radix-ui/react-label
npm install @radix-ui/react-select @radix-ui/react-separator
npm install @radix-ui/react-sidebar @radix-ui/react-switch
npm install @radix-ui/react-table @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-tooltip

# Icons
npm install lucide-react

# Fonts
npm install @next/font
```

### **2. Tailwind Configuration**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: 'rgb(239 246 255)',
          100: 'rgb(219 234 254)',
          200: 'rgb(191 219 254)',
          300: 'rgb(147 197 253)',
          400: 'rgb(96 165 250)',
          500: 'rgb(59 130 246)',
          600: 'rgb(37 99 235)',
          700: 'rgb(29 78 216)',
          800: 'rgb(30 64 175)',
          900: 'rgb(30 58 138)',
        },
        // Semantic colors
        success: {
          50: 'rgb(240 253 244)',
          100: 'rgb(220 252 231)',
          500: 'rgb(34 197 94)',
          600: 'rgb(22 163 74)',
          700: 'rgb(21 128 61)',
        },
        error: {
          50: 'rgb(254 242 242)',
          100: 'rgb(254 226 226)',
          500: 'rgb(239 68 68)',
          600: 'rgb(220 38 38)',
          700: 'rgb(185 28 28)',
        },
        warning: {
          50: 'rgb(255 251 235)',
          100: 'rgb(254 243 199)',
          500: 'rgb(245 158 11)',
          600: 'rgb(217 119 6)',
          700: 'rgb(180 83 9)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.2' }],
        'display-xl': ['3.75rem', { lineHeight: '1.2' }],
        'display-lg': ['3rem', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

### **3. Global CSS**
```css
/* globals.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap');

/* CSS Variables */
:root {
  /* Colors */
  --primary: 37 99 235;
  --primary-foreground: 255 255 255;
  --background: 15 23 42;
  --foreground: 248 250 252;
  --card: 30 41 59;
  --card-foreground: 248 250 252;
  --muted: 51 65 85;
  --muted-foreground: 148 163 184;
  --border: 51 65 85;
  --input: 51 65 85;
  --ring: 59 130 246;
  
  /* Success */
  --success: 34 197 94;
  --success-foreground: 255 255 255;
  
  /* Error */
  --error: 239 68 68;
  --error-foreground: 255 255 255;
  
  /* Warning */
  --warning: 245 158 11;
  --warning-foreground: 0 0 0;
  
  /* Typography */
  --font-inter: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --radius: 0.5rem;
}

/* Base styles */
* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-inter);
}

/* Component styles */
.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.card-metric {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.status-success {
  background: hsl(var(--success) / 0.1);
  color: hsl(var(--success));
  border: 1px solid hsl(var(--success) / 0.2);
}

.status-error {
  background: hsl(var(--error) / 0.1);
  color: hsl(var(--error));
  border: 1px solid hsl(var(--error) / 0.2);
}

.status-warning {
  background: hsl(var(--warning) / 0.1);
  color: hsl(var(--warning));
  border: 1px solid hsl(var(--warning) / 0.2);
}
```

---

## 🎯 **Component Library**

### **Status Components**
```typescript
// Status Indicator
export function StatusIndicator({ status, label }: { status: 'success' | 'error' | 'warning' | 'info', label: string }) {
  const statusConfig = {
    success: { color: 'text-green-600', bg: 'bg-green-500', label: 'Success' },
    error: { color: 'text-red-600', bg: 'bg-red-500', label: 'Error' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Warning' },
    info: { color: 'text-blue-600', bg: 'bg-blue-500', label: 'Info' },
  }
  
  const config = statusConfig[status]
  
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${config.bg}`} />
      <span className={`text-sm font-medium ${config.color}`}>{label}</span>
    </div>
  )
}
```

### **Metric Components**
```typescript
// Metric Card
export function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon 
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold font-mono">{value}</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend === 'up' ? (
              <ArrowUp className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-600" />
            )}
            <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>{change}</span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </Card>
  )
}
```

### **Environment Components**
```typescript
// Environment Switcher
export function EnvironmentSwitcher({ 
  current, 
  onSwitch 
}: { 
  current: 'simulator' | 'live'
  onSwitch: (env: 'simulator' | 'live') => void 
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Environment:</span>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 gap-2"
        onClick={() => onSwitch(current === 'simulator' ? 'live' : 'simulator')}
      >
        <span className={`h-2 w-2 rounded-full ${current === 'simulator' ? 'bg-green-500' : 'bg-blue-500'}`} />
        <span className="text-sm capitalize">{current}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  )
}
```

---

## 📱 **Responsive Design System**

### **Breakpoints**
```css
/* Responsive Breakpoints */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### **Responsive Patterns**
```css
/* Mobile First Approach */
.component {
  /* Mobile styles (default) */
  padding: 1rem;
  font-size: 1rem;
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: 1.5rem;
    font-size: 1.125rem;
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: 2rem;
    font-size: 1.25rem;
  }
}
```

---

## 🎯 **Implementation Checklist**

### **Phase 1: Core System**
- [ ] Install all dependencies
- [ ] Configure Tailwind CSS
- [ ] Set up font system (Inter + JetBrains Mono)
- [ ] Create color system
- [ ] Implement base components

### **Phase 2: Component Library**
- [ ] Button components
- [ ] Card components
- [ ] Form components
- [ ] Status components
- [ ] Navigation components

### **Phase 3: Application Integration**
- [ ] Update Landing Page
- [ ] Update Dashboard
- [ ] Update Mintlify Documentation
- [ ] Test consistency across all apps

### **Phase 4: Documentation**
- [ ] Component documentation
- [ ] Usage guidelines
- [ ] Design tokens reference
- [ ] Implementation examples

---

## 🚀 **Benefits of Unified Design System**

### **Consistency**
- ✅ **Visual Consistency**: Same colors, fonts, spacing across all apps
- ✅ **Interaction Consistency**: Same button styles, hover states
- ✅ **Component Consistency**: Reusable components across apps

### **Developer Experience**
- ✅ **Faster Development**: Pre-built components
- ✅ **Easier Maintenance**: Single source of truth
- ✅ **Better Collaboration**: Shared design language

### **User Experience**
- ✅ **Familiar Interface**: Consistent patterns
- ✅ **Professional Appearance**: Cohesive brand experience
- ✅ **Accessibility**: Consistent accessibility standards

---

## 📋 **Next Steps**

### **Immediate Actions**
1. **Create Design System Package**: Shared component library
2. **Update All Applications**: Apply design system consistently
3. **Documentation**: Create design system documentation
4. **Testing**: Test consistency across all applications

### **Long-term Goals**
1. **Component Library**: Publish as npm package
2. **Design Tokens**: Automated design token generation
3. **Storybook**: Interactive component documentation
4. **Design Handoff**: Figma integration

---

**Design System Version**: 1.0  
**Created**: 2025-01-09  
**Status**: Ready for Implementation  
**Next Step**: Begin Phase 1 Implementation
