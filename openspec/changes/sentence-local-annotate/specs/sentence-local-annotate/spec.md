## ADDED Requirements

### Requirement: Local light-red spans on sentence text

The system SHALL allow the learner to place one or more **local-only** light-red background spans on the displayed English sentence to mark clause or constituent boundaries, without persisting to the backend.

#### Scenario: User adds a highlight span

- **WHEN** the learner uses the supported gesture (e.g. drag-select or dedicated mode) to select a substring of the sentence and confirms the highlight action
- **THEN** that substring is rendered with a light-red (or equivalent design-token) background for the remainder of the session on that page

#### Scenario: Highlights are discarded on leave

- **WHEN** the learner navigates away from the long-sentence learning view or the component is destroyed
- **THEN** all local highlight data for that session is cleared and is not sent to any API

### Requirement: Multi-word selection and top annotation strip

The system SHALL allow the learner to select **one or more words** (or a defined token set) and attach **free-text notes** shown in a **fixed top area** of the view for the duration of the session.

#### Scenario: User creates a note for selected words

- **WHEN** the learner selects one or more words and enters text in the annotation UI
- **THEN** a note entry appears in the top area showing the association to the selected word(s) and the entered text until the page is left

#### Scenario: Notes are not persisted remotely

- **WHEN** any note or highlight exists
- **THEN** the application MUST NOT write this data to Supabase or other remote storage as part of this feature

### Requirement: Coexistence with existing sentence actions

The system SHALL preserve existing long-sentence behaviors (e.g. word lookup, vocabulary add) unless explicitly in a mode that disables them, as documented in the UI.

#### Scenario: Default learning actions still available

- **WHEN** the learner is not in a mode that explicitly overrides interactions
- **THEN** existing behaviors for word tap / lookup and vocabulary flows remain available as before this feature
