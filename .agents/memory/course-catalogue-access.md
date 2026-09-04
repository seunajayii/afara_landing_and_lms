---
name: Course catalogue access
description: The durable access model for assigning courses to cohorts
---

## Rule
Course availability has two modes: all participants (the safe default) or selected cohorts. A learner's selected-course access is determined by the cohort on their most recent accepted application; cohort status does not revoke access from an active programme participant.

**Why:** Existing published courses must continue working without manual backfill, while sponsored cohorts need separate catalogues without duplicating shared curriculum or resources.

Course resources should normally be created and attached from inside the module lesson editor, rather than forcing administrators to leave course building for a separate resource-creation workflow. The resulting resource remains reusable by other courses.

**Why:** Resources are part of curriculum construction, but storing them as reusable records avoids duplicate uploads and allows the same material to support multiple modules or cohorts.

**How to apply:** Enforce the same course assignment check on course detail, module/lesson reads, progress reads/writes, and resources linked to lessons. Admins bypass assignment checks, and a shared resource is available when at least one of its parent courses is available. Keep advanced library maintenance available within the combined Courses & Resources area, but make create-and-attach possible without leaving the lesson editor.