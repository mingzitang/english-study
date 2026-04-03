## ADDED Requirements

### Requirement: Doodle mode before translation submit

The system SHALL provide a **doodle mode** on the long-sentence learning view that the learner can enable **before** submitting their translation, allowing freehand drawing over the **English sentence area** for the current session only.

#### Scenario: Learner enables doodle mode

- **WHEN** the learner activates the doodle control (e.g. 「涂鸦」)
- **THEN** the system enters doodle mode and shows a drawing surface aligned to the English sentence container so that strokes appear over the sentence text

#### Scenario: Constituent and annotation modes are forced off when doodle starts

- **WHEN** the learner activates doodle mode while constituent marking and/or annotation word-picking is enabled
- **THEN** the system turns off constituent marking and annotation word-picking (and clears transient annotation-picking state such as in-progress selections or blocking modals, as defined in implementation) so that only doodle mode is active

#### Scenario: Learner draws while doodle mode is on

- **WHEN** the learner uses pointer input (touch, pen, or mouse) on the drawing surface and moves while pressed
- **THEN** the system renders continuous strokes visible on the drawing surface until the pointer is released

### Requirement: No remote persistence of doodles

The system MUST NOT send doodle geometry or raster data to Supabase or any other remote API as part of this feature.

#### Scenario: Session-only doodle data

- **WHEN** doodle strokes exist on the view
- **THEN** they exist only in browser memory for that page session and are not written to remote storage by this feature

### Requirement: Interaction exclusivity while doodling

While doodle mode is active, the system SHALL prevent sentence interactions that conflict with drawing (including constituent marking, annotation word picking, and word lookup gestures on the sentence) from receiving the same pointer gestures used for doodling.

#### Scenario: Sentence taps do not trigger learning actions during doodle

- **WHEN** doodle mode is active and the learner presses on the English sentence area
- **THEN** the input is consumed by doodling and MUST NOT trigger constituent toggles, annotation selection, or dictionary lookup on the sentence for that gesture

### Requirement: Doodle teardown on leave

The system SHALL clear all doodle graphics and stop doodle mode when the learner navigates away from the long-sentence learning view or the hosting component is destroyed.

#### Scenario: Cleared after navigation

- **WHEN** the learner leaves the view or the component unmounts
- **THEN** no doodle strokes remain for that instance and no doodle data is retained in memory for future visits within the same design of this feature

### Requirement: Clear doodles explicitly

The system SHALL offer a way to erase all doodle strokes on the current view without leaving the page (e.g. a 「清除涂鸦」 control or equivalent).

#### Scenario: Learner clears doodles

- **WHEN** the learner invokes the clear-doodle action
- **THEN** all visible doodle strokes in the English sentence area are removed while other session-local state (e.g. constituent spans or local annotations, if any) is unchanged unless otherwise specified by product rules

### Requirement: Undo last doodle stroke

The system SHALL allow the learner to **undo the most recently completed** freehand stroke while in doodle mode (or while doodle data is still on screen), without clearing the entire canvas.

#### Scenario: Learner undoes the last stroke

- **WHEN** the learner invokes the undo-stroke action and at least one completed stroke exists
- **THEN** the last completed stroke is removed from the visible doodle and the remaining strokes still appear as before

#### Scenario: Undo with no strokes

- **WHEN** the learner invokes the undo-stroke action and no completed strokes exist
- **THEN** the system makes no visual change (or disables the control; implementation choice)

### Requirement: Clear doodles after successful translation submit

After a **successful** translation submit for the current sentence task, the system SHALL clear all doodle strokes on the long-sentence learning view for that flow.

#### Scenario: Doodles cleared on successful submit

- **WHEN** the learner submits their translation and the submission succeeds
- **THEN** all doodle strokes are removed from the English sentence area and the internal doodle session state for strokes is reset accordingly
