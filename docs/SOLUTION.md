## Issue with Bun and Local Packages

### Problem
The `@chargeflow/risk-signals` package is a local dependency defined in the `risk-engine` service. During Docker builds, Bun fails to resolve or cache this package, resulting in build failures.

### Observations
- The package is correctly linked locally using `npm link`.
- Bun encounters an `ENOENT` error when attempting to resolve the package during production builds.

### Proposed Solutions
1. **Pre-Build Dependencies**:
   - Install dependencies locally and copy the `node_modules` directory into the Docker image.
   - This bypasses Bun's resolution issues during the build process.

2. **Switch to Node.js**:
   - Replace Bun with Node.js for dependency management and builds.
   - Node.js handles linked packages more reliably, especially in Docker environments.

3. **Alternative Approaches**:
   - Publish the `@chargeflow/risk-signals` package to a private registry.
   - Use a different dependency management tool that supports local packages better.

### Recommendation
For immediate resolution, pre-build dependencies locally and copy them into the Docker image. For long-term stability, consider switching to Node.js for dependency management.