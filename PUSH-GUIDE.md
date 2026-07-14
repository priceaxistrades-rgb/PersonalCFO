# Push this folder with GitHub Desktop

1. Extract this ZIP as a folder named `PersonalCFO`.
2. In GitHub Desktop choose **File → Add Local Repository**.
3. Select the extracted `PersonalCFO` folder.
4. Review the changed files.
5. Commit all changes to `main`.
6. Push origin.

This folder includes `.git` metadata and the `origin` remote. It does not include `node_modules`, `.next`, or environment secrets.
Before deployment, run `npm ci`, `npm run db:push` against the intended database, and then deploy.
