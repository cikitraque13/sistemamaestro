# Executor sandbox

Each builder build writes a draft on `builder_landing_states` (`stage: draft`) through `DraftBoundary`. That object can load and save the owner's draft. It is not given `builder_publications`, and it has no publish method.

`assert_promotable` refuses a version that missed `EVAL_PASS_THRESHOLD`. The publish service is unchanged in this change; wiring that check into publication is a separate front. The executor never calls it and never receives `builder_publications`.

The process is the API process. This change does not start a worker, a container, or a Railway service.

## If Lucas wants a real ephemeral container

Run the copy loop in a short-lived container that can call the model APIs and write one draft row, with no credentials for publications, DNS, or Stripe. That is a new Railway service (or a job on the existing API service). Rough cost, on top of the model bill: a few seconds of CPU and memory per build, plus image storage. At a low build rate that is well under a dollar a day; it is not free, and it needs a network policy so the job cannot reach the publish collection. Do not add it until that cost and the secret split are accepted.

Until then the boundary is the code path above: drafts only, promotion only after the rubric.
