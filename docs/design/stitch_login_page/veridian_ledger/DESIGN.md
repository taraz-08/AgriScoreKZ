# Design System Specification

## 1. Overview & Creative North Star: "The Digital Agronomist"
The Creative North Star for this design system is **"The Digital Agronomist."** This concept moves beyond standard government bureaucracy into a space of high-precision, data-driven stewardship. We are not just building a portal; we are creating a sophisticated, editorial-grade dashboard that feels as fertile as the soil it monitors and as precise as the technology used to analyze it.

To break the "template" look, this system utilizes **Intentional Asymmetry**. We lean into large, high-contrast typography scales and "Organic Layering"—where data cards don't just sit on a grid, but inhabit a space of shifting tonal depths. By prioritizing breathing room (whitespace) over structural lines, we create an experience that feels premium, authoritative, and profoundly modern.

---

## 2. Colors & Surface Architecture
The palette is rooted in the deep greens of governance and the golden hues of a successful harvest. However, the execution must be sophisticated.

### Tonal Logic
*   **Primary (#00450d):** Use for high-authority actions and "The Anchor"—the primary navigation or major section headers.
*   **Secondary (#1b6d24):** Use for supportive interactive elements and success-state highlights.
*   **Tertiary/Accent (#f9a825):** The "Harvest Gold." Use sparingly for data-driven highlights, critical KPI trends, and high-priority alerts.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders for sectioning are strictly prohibited.** Do not use lines to separate the sidebar from the main content or to divide the header. Instead:
*   Use background color shifts (e.g., a `surface-container-low` sidebar against a `surface` main body).
*   Use the **Spacing Scale** (Step 12 or 16) to create "Gaps of Intent" that define boundaries naturally.

### Surface Hierarchy & Nesting
Treat the UI as a physical desk of stacked high-quality paper.
*   **Base:** `background` (#f8faf8)
*   **Secondary Areas:** `surface-container-low` (#f2f4f2)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Elevated Details:** `surface-container-high` (#e6e9e7) for nested information inside cards.

### Signature Textures
While the UI is primarily flat, Hero sections and "Score Overview" cards may use a **Subtle Tonal Gradient**:
*   *Direction:* 135deg
*   *Values:* `primary` (#00450d) to `primary-container` (#1b5e20). This adds a "soul" to the data, making the score feel like a premium certification.

---

## 3. Typography: The Editorial Edge
We use typography as a layout element, not just a content carrier.

*   **Headings (Inter Bold):** Use `display-lg` for dashboard titles to create a high-contrast, "magazine" feel. Headlines should be tight-tracked (-0.02em) to look authoritative.
*   **Body (Inter Regular):** Maximized for readability with a generous line height (1.6) for `body-md`.
*   **Data & Numbers (JetBrains Mono):** This is our "Precision Layer." All numeric values, agricultural coordinates, and scores must use JetBrains Mono. This conveys a sense of technical accuracy and "SaaS-native" performance.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are the fallback, not the standard. We prioritize **Tonal Lift**.

### The Layering Principle
Create depth by stacking tiers. A `surface-container-lowest` (#ffffff) card placed on a `surface-container` (#eceeec) section creates a soft, natural lift that is cleaner than any drop shadow.

### Ambient Shadows
When a floating effect is required (e.g., Modals or Popovers), use an **Ambient Shadow**:
*   *Values:* `0px 20px 40px rgba(25, 28, 27, 0.06)`
*   The shadow is not grey; it is a diluted version of the `on-surface` color, making the UI feel integrated with the "lighting" of the page.

### Glassmorphism & The "Frost" Effect
For floating navigation bars or filter overlays, use:
*   `surface-container-lowest` at 80% opacity.
*   `backdrop-blur: 12px`.
This allows the agricultural data colors to bleed through, softening the interface and making it feel like a sophisticated lens.

### The "Ghost Border"
If a container requires a border for accessibility (WCAG 2.1 AA), use a **Ghost Border**:
*   `outline-variant` (#c0c9bb) at 20% opacity. This provides a "suggestion" of a boundary without cluttering the visual field.

---

## 5. Components

### Buttons: The Weighted Action
*   **Primary:** Solid `primary` with `on-primary` text. No border. Rounded-lg (0.5rem).
*   **Secondary:** `surface-container-low` background with `primary` text. Soft, accessible, and high-contrast.
*   **Tertiary:** Transparent background, `primary` text, underlined on hover.

### Cards: Forbidding the Divider
*   **Structure:** Use `rounded-xl` (1.5rem).
*   **Separation:** **Never use horizontal lines to separate card content.** Use vertical whitespace (Spacing Step 6) or a subtle background shift to `surface-container-high` for the card's footer/header.

### Input Fields: The Subtle Tray
*   **Default State:** `surface-container-highest` background, no border, `rounded-md`.
*   **Active State:** `surface-container-lowest` background, 1px `primary` border. This creates a "pop-out" effect when the user interacts.

### Agricultural "Score" Chips
*   **Custom Component:** Large, circular or `rounded-full` badges using JetBrains Mono for the score. Use `tertiary-container` (#724900) for high-risk scores and `primary-fixed` (#acf4a4) for optimal health scores.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use JetBrains Mono for all "Technical" data (Yields, Soil PH, ID numbers).
*   **Do** use `display-lg` typography to create clear visual entry points.
*   **Do** allow at least 64px (Spacing Step 16) of whitespace between major sections.
*   **Do** use Glassmorphism for overlays to maintain a sense of environmental depth.

### Don’t:
*   **Don’t** use 100% black text; use `on-surface` (#191c1b) to maintain a premium "ink" feel.
*   **Don’t** use 1px solid dividers to separate content blocks.
*   **Don’t** use standard "drop shadows" with high opacity.
*   **Don’t** crowd the interface. If the data is dense, increase the surface area of the card, do not decrease the font size.