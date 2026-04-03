## ADDED Requirements

### Requirement: Learner shell uses tablet-wide layout from md breakpoint

The system SHALL apply a **responsive learner shell** such that when the viewport width is at least the **`md` breakpoint** (768px), the main content area does not stretch arbitrarily wide: it MUST be constrained by a **maximum width**, horizontally centered, with side margins/padding so line length remains comfortable for reading and study tasks.

#### Scenario: Tablet-width viewport gets centered content column

- **WHEN** the learner uses a device or window width at or above the `md` breakpoint on a route using the primary learner layout (`MainLayout` or equivalent)
- **THEN** the primary study content is displayed within a bounded width column centered in the viewport (not full-bleed text to screen edges only)

### Requirement: Learn sub-routes share the same width constraint

Routes that use the **back-navigation learner layout** (`LearnLayout` or equivalent for deep study screens) SHALL use the **same maximum-width / centering behavior** as the primary learner shell at the `md` breakpoint and above, so switching between home tab flow and e.g. long-sentence training does not change content column width arbitrarily.

#### Scenario: Long-sentence view aligns with home shell width

- **WHEN** the learner opens a screen wrapped by `LearnLayout` at tablet width
- **THEN** the main content follows the same width rules as `MainLayout` at `md` and above

### Requirement: Navigation remains usable on tablet

At `md` breakpoint and above, the system SHALL keep **primary navigation** (access to main app sections) **visible and tappable** without requiring interactions that only work on small phones; layout MUST avoid overlapping fixed chrome with critical content in common tablet portrait and landscape sizes.

#### Scenario: No essential content hidden under unusable chrome on iPad-sized viewport

- **WHEN** the viewport is approximately tablet size (e.g. 768px–1024px width) in portrait or landscape
- **THEN** the learner can reach bottom primary actions and read core study UI without unavoidable occlusion from fixed navigation (or navigation is adapted for tablet per implementation)

### Requirement: Viewport configuration does not block accessibility zoom by default

Unless an explicit product exception is documented, the HTML viewport configuration SHALL **not** forbid user scaling in a way that prevents pinch-to-zoom on tablet-class devices (i.e. avoid `user-scalable=no` / `maximum-scale=1` as the only story for the whole app).

#### Scenario: Zoom is not globally disabled by viewport meta

- **WHEN** the app loads on a standard browser on a tablet
- **THEN** the default viewport policy does not include `user-scalable=no` together with `maximum-scale=1.0` **unless** a documented exception applies and is referenced in release notes or spec addendum
