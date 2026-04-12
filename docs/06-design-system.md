# MindBridge Design System

Complete design token reference extracted from the Pencil design file (`mindbridge-pen.pen`).
Source of truth for implementing screens in React Native (Expo).

## 0. Setup

```bash
# Required: gradient support (CTA buttons, Mira card, user bubbles, FAB)
npx expo install expo-linear-gradient
```

Already in `package.json`:
- `lucide-react-native` — icons
- `@expo-google-fonts/plus-jakarta-sans` — typography
- `@gorhom/bottom-sheet` — End Session sheet
- `react-native-reanimated` — animations
- `react-native-svg` — SVG for lucide

---

## 1. Screen Map

All screens exist in both **light** and **dark** variants in the .pen file.

| Screen | Light Node | Dark Node | Size |
|--------|-----------|-----------|------|
| Home | `94yJz` | `bE5QD` | 390 × 1190 |
| Sessions | `MCU52` | `hzDR2` | 390 × 1288 |
| Chat | `99gzI` | `fNdlf` | 390 × 844 |
| Post-Session: Full | `8R4sc` | `ZLUnJ` | 390 × 896 |
| Post-Session: Loading | `CXefT` | `PDxqx` | 390 × ~896 |
| Post-Session: Ready | `V4yUN` | `rUkDd` | 390 × ~896 |
| End Session Sheet | `DfKG3` | `WWwUx` | 390 × 433 |
| Input: Typing | `IiGX2` | `OIxD2` | 390 × ~80 |
| Input: Recording | `IHq6J` | `ZSDo8` | 390 × ~120 |

---

## 2. Color Palette

### 2.1 Light Theme

#### Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#C4856F` | Primary accent, CTA fills, active states, filter tab active bg |
| `primaryLight` | `#D4A08C` | Gradient start (CTA, mic button, FAB) |
| `primaryDark` | `#C07A63` | User bubble gradient end, pressed states |
| `primaryDeep` | `#B56756` | Mira hero card gradient start |
| `primaryWarm` | `#D9A48E` | User bubble gradient start |
| `primaryPeach` | `#E0A88A` | Mira hero card gradient end |

#### Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F7F3EE` | App background, active tab fill |
| `card` | `#FFFFFF` | Cards, AI bubbles, input area, bottom sheet |
| `warmBg` | `#FFF8F0` | Timer pill, exercise card, journal icon bg, mood circles |
| `inputBg` | `#F5F2EF` | Input field, attach button, theme toggle circle |
| `warmBorder` | `#F0E4DE` | Card strokes, dividers, tab bar border |
| `inputBorder` | `#EDE8E4` | Input area top border, inactive filter tabs |
| `focusBorder` | `rgba(196,133,111,0.25)` | Input focus ring |

#### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#2B2320` | Headings, main content, active tab labels |
| `textDark` | `#2D1B14` | Status bar time |
| `textBody` | `#5C4A3D` | Body in takeaways/exercises |
| `textSecondary` | `#9A8880` | Subtitles, icons, inactive elements |
| `textMuted` | `#B0A098` | Placeholders, hints, inactive tab labels |

#### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `green` | `#7A9E7E` | Active session stroke, checkmark icons |
| `greenDark` | `#5E9E66` | Active session CTA |
| `greenLight` | `#E8F2E9` | Breathe bg, takeaway check bg, end option icon bg |
| `greenMint` | `#C2E5C4` | Live badge bg, active card icon bg |
| `greenGradientStart` | `#DDF0DE` | Active card gradient |
| `greenGradientEnd` | `#F5FBF5` | Active card gradient |
| `purple` | `#8B6FC0` | Reflect icon |
| `purpleLight` | `#EEEAF5` | Reflect bg, mindfulness tags |
| `avatarBg` | `#E8CFC4` | User avatar circle |
| `sosBg` | `#FAE8E5` | SOS icon background |
| `recordingRed` | `#E25C5C` | Recording dot |

### 2.2 Dark Theme

Implemented — not just suggested. All screens have dark variants in the .pen file.

**Principle:** Warm brown tones (not pure black/gray). Elevation via brightness: deeper = darker surface.

| Light | Dark | Token |
|-------|------|-------|
| `#F7F3EE` | `#1A1412` | `background` |
| `#FFFFFF` | `#221E1B` | `card` |
| `#FFF8F0` | `#2A211B` | `warmBg` |
| `#F5F2EF` | `#2E2824` | `inputBg` |
| `#F0E4DE` | `#3A332E` | `warmBorder` |
| `#EDE8E4` | `#2E2824` | `inputBorder` |
| `#2B2320` | `#E8E0D8` | `text` |
| `#2D1B14` | `#F2EAE2` | `textDark` |
| `#5C4A3D` | `#C4B8AD` | `textBody` |
| `#9A8880` | `#A09A93` | `textSecondary` |
| `#B0A098` | `#7A6F65` | `textMuted` |
| `#C4856F` | `#D4A89A` | `primary` (text on dark), fills stay `#C4856F` |
| `#E8F2E9` | `#1A2E1C` | `greenLight` |
| `#C2E5C4` | `#2A3E2C` | `greenMint` |
| `#EEEAF5` | `#252030` | `purpleLight` |
| `#E8CFC4` | `#3A2E28` | `avatarBg` |
| `#FAE8E5` | `#3A2220` | `sosBg` |
| `#DDF0DE→#F5FBF5` | `#1E2E1F→#222E22` | Active session gradient |

#### Dark-specific notes

- Coral accent fills (gradients, FAB, mic) stay unchanged — already bright enough
- Coral as text (links, labels) uses `#D4A89A` for contrast
- Shadows use `#000000` as base instead of `#2B2320`
- Tab bar: bg `#221E1B`, active `#2E2824`, inactive text/icons `#7A6F65`
- End Session sheet: bg `#221E1B`, option cards `#2E2824`, handle `#3A332E`
- Emoji text fill: `#E8E0D8` (not `#000000`!)

---

## 3. Gradients

| Name | Colors | Rotation | RN start→end | Usage |
|------|--------|----------|--------------|-------|
| CTA Primary | `#D4A08C → #C4856F` | 180° | `[0.5,0] → [0.5,1]` | Buttons, mic, send, FAB |
| Mira Hero | `#B56756 → #C4856F → #E0A88A` | 150° | `[0.75,0] → [0.25,1]` | Mira card on Home |
| User Bubble | `#D9A48E → #C07A63` | 210° | `[0.25,0] → [0.75,1]` | User chat messages |
| Active Session | `#DDF0DE → #F5FBF5` | 210° | `[0.25,0] → [0.75,1]` | Active session card |
| Start CTA | `#D4A08C → #C4856F` | 270° | `[0.5,1] → [0.5,0]` | "Start New Session" banner |

Dark mode: CTA/Hero/Bubble gradients stay the same. Active Session changes to `#1E2E1F → #222E22`.

---

## 4. Typography

**Font:** Plus Jakarta Sans

| Style | Size | Weight | Font constant | Usage |
|-------|------|--------|---------------|-------|
| headingXL | 26 | 700 | `bold` | Screen titles ("Alex", "Sessions") |
| headingL | 22 | 700 | `bold` | "Session Complete" |
| headingM | 15–16 | 700 | `bold` | Card titles, CTA labels |
| sheetTitle | 20 | 700 | `bold` | Bottom sheet title |
| body | 14 | 400 | `regular` | Messages, descriptions |
| bodySmall | 13 | 400–600 | `regular`/`semibold` | Takeaway text, meta info |
| caption | 11 | 500–600 | `medium`/`semibold` | Tool labels, timestamps, tags |
| tabLabel | 10 | 500–600 | `medium`/`semibold` | Tab bar |

Special: `lineHeight: 1.5` on body text in analysis. `letterSpacing: 0.2` tabs, `0.8` section headers ("THIS WEEK").

---

## 5. Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `screen` | 20 | Horizontal padding on all screens |
| `sectionGap` | 16 | Between major content sections |
| `cardPadding` | 16–20 | Inside cards |
| `cardGap` | 10–14 | Between items inside cards |
| `itemGap` | 8 | Small elements (icons + text) |
| `messageGap` | 16 | Between chat messages |
| `tabBarPadding` | `[10, 20, 28, 20]` | Tab bar (top, right, bottom, left) |
| `bubblePadding` | 14 | Inside chat bubbles |
| `sheetPadding` | `[8, 24, 34, 24]` | Bottom sheet |

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `card` | 20 | Session/mood/overview cards |
| `cardLarge` | 24 | Mira hero card |
| `button` | 14–16 | Buttons, sheet options |
| `pill` | 22 | CTA, input, 44px icon circles |
| `tag` | 12 | Tags, badges, filter tabs |
| `tabBar` | 32 | Tab bar container |
| `tabItem` | 28 | Tab bar items |
| `avatar` | 20 | 40×40 circles (bell, avatar, theme toggle) |
| `fab` | 30 | Floating action button |
| `sheetTop` | 28 | Bottom sheet top corners |
| `bubbleAI` | `[0, 16, 16, 16]` | AI message (sharp top-left) |
| `bubbleUser` | `[16, 0, 16, 16]` | User message (sharp top-right) |

---

## 7. Shadows

```ts
// Ready to spread into RN StyleSheet
const shadows = {
  card: {
    shadowColor: '#2B2320', // dark: '#000000'
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    shadowColor: '#C4856F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.19,
    shadowRadius: 12,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#2B2320',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  bubbleAI: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    shadowColor: '#C4856F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.125,
    shadowRadius: 6,
    elevation: 2,
  },
  fab: {
    shadowColor: '#C4856F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  bottomSheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.125, // dark: 0.25
    shadowRadius: 30,
    elevation: 12,
  },
};
```

---

## 8. Icons

**Library:** `lucide-react-native` | **Standard:** 20×20 | **Small:** 14–16 | **Large:** 24–26

| Icon | Component | Size | Where |
|------|-----------|------|-------|
| Home tab | `House` | 20 | Tab bar |
| Sessions tab | `MessageCircle` | 20 | Tab bar |
| Analytics tab | `Activity` | 20 | Tab bar |
| Profile tab | `User` | 20 | Tab bar |
| Back | `ChevronLeft` | 24 | Chat header |
| Close | `X` | 24 | Sheet, post-session, cancel recording |
| Menu | `EllipsisVertical` | 20 | Chat header |
| Plus | `Plus` | 20–26 | Attach, FAB, new session |
| Send | `ArrowUp` | 20 | Send message/voice |
| Mic | `Mic` | 20 | Voice record |
| Timer | `Timer` | 16 | Duration label |
| Topic | `MessageCircle` | 16 | Topic label |
| Arrow right | `ArrowRight` | 20 | Mood change |
| Chevron right | `ChevronRight` | 20 | CTA arrow |
| Bell | `Bell` | 18 | Notifications |
| Sparkles | `Sparkles` | 14 | AI indicator |
| CircleCheckBig | `CircleCheckBig` | 14–22 | Takeaway checks, end option |
| Pause | `Pause` | 22 | Pause option |
| Sun | `Sun` | 18 | Theme toggle (light mode) |
| Moon | `Moon` | 18 | Theme toggle (dark mode) |
| BookOpen | `BookOpen` | 20 | Journal tool |
| Wind | `Wind` | 20 | Breathe tool |
| Phone | `Phone` | 20 | SOS tool |
| Lightbulb | `Lightbulb` | 20 | Reflect tool |

---

## 9. Component Specifications

### 9.1 Header (Home Screen)

```
Container: padding [4, 20, 16, 20], horizontal, space_between, center
  Left:
    Greeting: 13px, regular, textSecondary
    Name: 26px, bold, text
  Right: horizontal, gap 10
    Theme Toggle: 40×40, radius 20
      Light: fill inputBg, Sun icon 18, textSecondary
      Dark: fill inputBg, Moon icon 18, primaryLight (#D4A89A)
    Bell: 40×40, radius 20, fill card (dark: inputBg)
      Bell icon 18, text
    Avatar: 40×40, radius 20, fill avatarBg
      Letter: 14px, bold, textBody
```

### 9.2 Tab Bar

```
Container: height 90, padding [10, 20, 28, 20]
  Pill: height 62, radius 32, fill card, stroke 1px warmBorder
    shadow: tabBar
    4 items, equal width
    Active: fill background, radius 28
      Icon 20, text color | Label 10px, semibold, text, letterSpacing 0.2
    Inactive:
      Icon 20, textMuted | Label 10px, medium, textMuted
```

### 9.3 Mira Hero Card

```
Wrapper: padding [0, 20]
  Card: radius 24, padding 20, gap 10, gradient Mira Hero
    Top row: horizontal, gap 8, center
      Avatar: 32×32, radius 16, fill white → Sparkles 16, coral
      "Mira ✨" — 13px, semibold, white
    Title: 18px, bold, white
    Subtitle: 13px, regular, white 80%
    CTA: height 44, radius 22, fill white
      "Start a Session →" — 14px, semibold, coral
```

### 9.4 Mood Check-In

```
Card: radius 20, padding 18, gap 14, fill card, shadow card
  Title: 15px, bold, text
  Row: horizontal, space_between
    5 moods (Sad, Low, Okay, Good, Great):
      Circle: 48×48 (dark) / 36×36 (light), radius half, fill warmBg
        Emoji: 20–22px, fill text (IMPORTANT: not #000000 in dark mode!)
      Label: 12px, medium, textMuted
```

### 9.5 Quick Tools

```
Row: horizontal, gap 10, each fill_container
  Tool: vertical, center, gap 6
    Circle: 44×44, radius 22
    Label: 11px, medium, textMuted

  Journal:  bg warmBg (dark: #2A211B),   icon BookOpen,  fill primary
  Breathe:  bg greenLight (dark: #1A2E1C), icon Wind,     fill green
  SOS:      bg sosBg (dark: #3A2220),      icon Phone,    fill recordingRed/danger
  Reflect:  bg purpleLight (dark: #252030), icon Lightbulb, fill purple
```

### 9.6 Session Card — Active

```
Card: radius 20, padding 18, gap 14
  fill: gradient Active Session, stroke 1.5px green
  Top row: horizontal, gap 12, center
    Circle: 44×44, radius 22, fill greenMint
    Title: 14px, semibold, text | Sub: 12px, regular, textSecondary
    Live badge: radius 20, fill greenMint, padding [4,10]
      Dot: 6×6 green + "Live" 11px semibold
  CTA: height 42, radius 12, fill greenDark
    "Continue Session →" — 14px, semibold, white
```

### 9.7 Session Card — Completed

```
Card: radius 20, padding 16, gap 12, fill card, shadow completedCard
  Top: horizontal, gap 12
    Circle: 44×44, radius 22, fill warmBorder/purpleLight
    Title: 14px, semibold, text | Sub: 12px, regular, textSecondary
  Tags: horizontal, gap 8
    Tag: radius 12, padding [4,10], category-colored bg + text
  Link: "View analysis →" 13px, semibold, primary (dark: primaryLight)
```

### 9.8 Chat Messages

```
Area: vertical, gap 16, padding [16, 20], fill background

AI Message:
  Row: horizontal, gap 8
    Avatar: 28×28, radius 14, gradient CTA Primary → Sparkles 14 white
    Bubble: radius [0,16,16,16], padding 14, fill card, shadow bubbleAI
      Text: 14px, regular, text

User Message:
  Row: horizontal, justify end
    Bubble: radius [16,0,16,16], padding 14, maxWidth 260
      fill: gradient User Bubble, shadow bubbleUser
      Text: 14px, regular, white
```

### 9.9 Input Area (3 states)

```
Container: fill card, padding [12,16,8,16], stroke top 1px inputBorder

DEFAULT:
  Row: horizontal, gap 8, alignItems end
    Attach: 40×40, radius 20, fill inputBg → Plus 20 textSecondary
    Input: radius 22, fill inputBg, padding [10,16]
      Placeholder: 14px, textMuted
    Mic: 40×40, radius 20, gradient CTA Primary, shadow button → Mic 20 white

TYPING:
    Input: +stroke 1.5px focusBorder
    Text: 14px, text
    Send replaces Mic: → ArrowUp 20 white

RECORDING:
  Row: horizontal, gap 12
    Cancel: 40×40, radius 20, fill inputBg → X 18 textSecondary
    Waveform: fill warmBg, radius 20, padding [0,16]
      Red dot 8×8, 14 bars (width 3, height 8–28, fill primary), Timer 13px semibold primary
    Send: gradient CTA Primary → ArrowUp 20 white
  Hint: "Slide left to cancel" 11px textMuted, center
```

### 9.10 End Session Sheet

```
Sheet: radius [28,28,0,0], fill card, padding [8,24,34,24], gap 20
  shadow: bottomSheet
  Handle: 40×4, radius 2, fill inputBorder (dark: #3A332E), center
  Title: 20px, bold, text, center
  Subtitle: 14px, regular, textSecondary, center, lineHeight 1.5
  Options: vertical, gap 10
    Card: radius 16, padding 16, fill card (dark: inputBg), stroke 1px warmBorder
      Row: horizontal, gap 14, center
        Circle: 44×44, radius 22
        Title: 15px, bold, text | Desc: 12px, regular, textSecondary, lineHeight 1.4
    End: circle bg greenLight, CircleCheckBig green
    Pause: circle bg warmBg, Pause primary
  CTA: height 52, radius 16, gradient CTA Primary, shadow button
    MessageCircle 18 white + "Keep Talking" 15px bold white
```

### 9.11 Post-Session Summary

```
SESSION HEADER:
  "Session Complete" — headingL, text
  "Great work today, Alex ✨" — body, textSecondary
  X close: 24×24, textSecondary

OVERVIEW CARD: radius 20, padding 20, gap 14, fill card, shadow card
  Duration/Topic rows: space_between
    Left: icon 16 textSecondary + label 13px regular textSecondary
    Right: value 13px semibold text
  Divider: 1px warmBorder
  Mood label: 13px semibold text
  Mood row: center, gap 24
    Circle 44, emoji, label 12px | ArrowRight 20 primary | Circle 44, emoji, label 12px

KEY TAKEAWAYS: radius 20, padding 18, gap 12, fill card, shadow card
  Title: 15px bold text
  Items: vertical, gap 12
    Check circle: 24×24, radius 12, fill greenLight → CircleCheckBig 14 green
    Text: 13px regular textBody, lineHeight 1.5

EXERCISE CARD: radius 16, padding 16, gap 8, fill warmBg, stroke 1px warmBorder
  Label: Sparkles 14 + "Suggested Exercise" 11px semibold primary
  Title: 14px bold text
  Body: 13px regular textBody, lineHeight 1.5

BUTTONS:
  Primary: height 48, radius 14, gradient CTA Primary, shadow button → 14px bold white
  Secondary: height 48, radius 14, fill card, stroke 1px warmBorder → 14px semibold textSecondary
```

### 9.12 Post-Session Loading State

```
Container: radius 20, padding 20, fill warmBg, center, gap 12
  Spinner: rotating circle, coral
  "Preparing your analysis" — 15px bold text
  Subtitle — 14px regular textSecondary, center
  Steps: vertical, gap 8
    Done: CircleCheckBig green (#1A2E1C bg) + 13px textBody
    Active: Sparkles primary + 13px primary (animated)
```

### 9.13 Post-Session Ready State

```
Container: radius 20, padding 20, fill warmBg, center, gap 12
  Checkmark: large, green, 48×48
  "Analysis ready" — 15px bold text
  Subtitle — 14px regular textSecondary, center
  "View Analysis" — gradient CTA Primary, Sparkles icon
```

---

## 10. Layout Patterns

### Screen Structure (390pt wide, iPhone 14/15)

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
  <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
    {/* Sections with paddingHorizontal: 20 */}
  </ScrollView>
  <TabBar />  {/* height 90, fixed bottom */}
</SafeAreaView>
```

Chat replaces TabBar with InputArea. Post-Session has no tab bar.

### Card Pattern

```tsx
<View style={{
  backgroundColor: colors.card,
  borderRadius: 20,
  padding: 18,
  gap: 12,
  ...shadows.card,
}}>
```

### Responsive Width

Design = 390px. Use `Dimensions.get('window').width` or flex-based layouts, never hardcode 390.

---

## 11. Animations

| Element | Animation | Library |
|---------|-----------|---------|
| Typing indicator | 3 dots, staggered bounce | reanimated |
| Recording waveform | Bar height oscillation | reanimated |
| Loading spinner | Continuous rotation | reanimated |
| Step completion | Fade + scale checkmark | reanimated |
| Bottom sheet | Spring gesture | @gorhom/bottom-sheet |
| Message appear | Fade + slide up | reanimated |
| Theme switch | Background color transition | reanimated |

---

## 12. theme.ts Sync Guide

Current `theme.ts` is missing several tokens needed for implementation. Below is what needs to be added to align with the designs.

### Missing from `colors.light`

```ts
// Surfaces
warmBg: '#FFF8F0',
inputBg: '#F5F2EF',

// Text
textBody: '#5C4A3D',

// Semantic
green: '#7A9E7E',
greenDark: '#5E9E66',
greenLight: '#E8F2E9',
greenMint: '#C2E5C4',
purple: '#8B6FC0',
purpleLight: '#EEEAF5',
avatarBg: '#E8CFC4',
sosBg: '#FAE8E5',
recordingRed: '#E25C5C',
focusBorder: 'rgba(196,133,111,0.25)',
```

### Missing from `colors.dark`

```ts
warmBg: '#2A211B',
inputBg: '#2E2824',
textBody: '#C4B8AD',
green: '#7A9E7E',
greenDark: '#5E9E66',
greenLight: '#1A2E1C',
greenMint: '#2A3E2C',
purple: '#A08BD0',
purpleLight: '#252030',
avatarBg: '#3A2E28',
sosBg: '#3A2220',
recordingRed: '#EF4444',
focusBorder: 'rgba(212,168,154,0.25)',
```

### Color value corrections (light)

Current `theme.ts` has some values that differ from the .pen design:

| Token | Current | Design | Action |
|-------|---------|--------|--------|
| `background` | `#FAF9F7` | `#F7F3EE` | Update to match design |
| `textSecondary` | `#7A6F65` | `#9A8880` | Update — currently swapped with dark's muted |
| `textMuted` | `#A09A93` | `#B0A098` | Update |
| `border` | `#E5DFD8` | `#F0E4DE` | Update |
| `borderLight` | `#F0EBE7` | `#EDE8E4` | Update |
| `miraBubble` | `#F3EFEC` | `#FFFFFF` | AI bubbles are white in design |
| `tabBarBorder` | `#E5DFD8` | `#F0E4DE` | Same as border |

### Exports to add

```ts
// Shadows (add to theme.ts)
export const shadows = { ... } // See Section 7

// Gradients (for expo-linear-gradient)
export const gradients = {
  ctaPrimary: {
    colors: ['#D4A08C', '#C4856F'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  miraHero: {
    colors: ['#B56756', '#C4856F', '#E0A88A'] as const,
    start: { x: 0.75, y: 0 },
    end: { x: 0.25, y: 1 },
  },
  userBubble: {
    colors: ['#D9A48E', '#C07A63'] as const,
    start: { x: 0.25, y: 0 },
    end: { x: 0.75, y: 1 },
  },
  activeSession: {
    colors: ['#DDF0DE', '#F5FBF5'] as const,
    start: { x: 0.25, y: 0 },
    end: { x: 0.75, y: 1 },
  },
};
```
