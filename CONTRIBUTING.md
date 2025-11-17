# Contributing to ThingsBoard

Thank you for your interest in contributing to ThingsBoard! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

Before you begin:
- Read the [README.md](./README.md) to understand the project
- Check existing [issues](https://github.com/thingsboard/thingsboard/issues) and [pull requests](https://github.com/thingsboard/thingsboard/pulls)
- Read our [Documentation](https://thingsboard.io/docs/) to understand ThingsBoard's architecture
- Review the [DEVELOPMENT.md](./DEVELOPMENT.md) guide for local setup instructions

## Development Setup

For detailed setup instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md).

### Quick Start

**Prerequisites:**
- Java 17 or higher
- Maven 3.6+
- Node.js 18+ and npm
- PostgreSQL 13+ (or Docker for development)
- Git

**Basic Setup:**
```bash
# Clone the repository
git clone https://github.com/thingsboard/thingsboard.git
cd thingsboard

# Build the project
mvn clean install -DskipTests

# For React frontend
cd frontend-react
npm install
npm run dev
```

For complete setup instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes** - Fix issues in existing functionality
2. **New Features** - Add new capabilities to ThingsBoard
3. **Documentation** - Improve or add documentation
4. **Tests** - Add or improve test coverage
5. **Performance** - Optimize existing code
6. **Code Quality** - Refactoring and cleanup

### Contribution Workflow

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `master`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our code style guidelines
4. **Write tests** for your changes
5. **Run tests locally** to ensure nothing breaks
   ```bash
   mvn clean test
   ```
6. **Commit your changes** with clear, descriptive messages
   ```bash
   git commit -m "Add feature: description of your change"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** from your fork to the main repository

## Code Style Guidelines

### Java

- Follow standard Java naming conventions
- Use 4 spaces for indentation (no tabs)
- Add JavaDoc comments for public classes and methods
- Maximum line length: 120 characters
- Use meaningful variable and method names
- Follow existing code patterns in the module you're modifying

**Example:**
```java
/**
 * Processes incoming telemetry data from IoT devices.
 *
 * @param deviceId the unique identifier of the device
 * @param telemetry the telemetry data to process
 * @return processed telemetry result
 * @throws ProcessingException if processing fails
 */
public TelemetryResult processTelemetry(String deviceId, TelemetryData telemetry)
        throws ProcessingException {
    // Implementation
}
```

### TypeScript/React

- Use 2 spaces for indentation
- Use TypeScript types for all function parameters and return values
- Follow functional component patterns with hooks
- Add JSDoc comments for complex functions
- Use meaningful component and variable names
- Follow existing patterns in `frontend-react/src`

**Example:**
```typescript
/**
 * Renders a device card with telemetry data
 *
 * @param device - The device entity to display
 * @param onUpdate - Callback when device is updated
 */
export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onUpdate }) => {
  // Implementation
};
```

### Python

- Follow PEP 8 style guide
- Use 4 spaces for indentation
- Add docstrings to all modules, classes, and functions
- Maximum line length: 100 characters
- Use type hints where appropriate

**Example:**
```python
def process_telemetry(device_id: str, data: Dict[str, Any]) -> TelemetryResult:
    """
    Process telemetry data from a device.

    Args:
        device_id: Unique identifier of the device
        data: Telemetry data dictionary

    Returns:
        Processed telemetry result

    Raises:
        ProcessingError: If processing fails
    """
    # Implementation
```

### General Guidelines

- Write self-documenting code with clear variable names
- Add comments for complex logic
- Keep functions small and focused (single responsibility)
- Avoid code duplication - extract common logic
- Handle errors appropriately
- Log important operations with appropriate log levels

## Pull Request Process

### Before Submitting

1. **Update documentation** if you've changed APIs or added features
2. **Add tests** for new functionality
3. **Run all tests** locally and ensure they pass
4. **Update CHANGELOG** if applicable
5. **Ensure your code follows style guidelines**
6. **Rebase on latest master** to avoid merge conflicts

### Pull Request Template

Use this template when creating a PR:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated documentation
- [ ] I have added tests
- [ ] All tests pass locally
- [ ] My changes generate no new warnings
```

### Review Process

1. **Automated checks** must pass (build, tests, linting)
2. **Code review** by maintainers (may take 1-7 days)
3. **Address feedback** - make requested changes
4. **Final approval** - maintainer approves and merges

## Reporting Bugs

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Test on the latest version** to see if it's already fixed
3. **Gather information** about the bug

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- ThingsBoard version:
- OS: [e.g., Ubuntu 22.04]
- Browser (if frontend): [e.g., Chrome 120]
- Database: [e.g., PostgreSQL 14]

**Logs**
Relevant log excerpts

**Additional context**
Any other context about the problem
```

## Feature Requests

We welcome feature requests! Please:

1. **Search existing requests** to avoid duplicates
2. **Describe the use case** - why is this feature needed?
3. **Provide examples** of how it would be used
4. **Consider implementation** - suggest possible approaches

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Alternative solutions or features

**Use Case**
Real-world scenario where this would be useful

**Additional context**
Any other context, mockups, or examples
```

## Documentation

Good documentation is crucial! You can contribute by:

1. **Fixing typos** or improving clarity
2. **Adding examples** to existing docs
3. **Writing tutorials** for common use cases
4. **Documenting new features** you add
5. **Creating module READMEs** for undocumented modules
6. **Adding JSDoc/JavaDoc** comments to code

## Community

### Getting Help

- **Documentation**: https://thingsboard.io/docs/
- **GitHub Issues**: https://github.com/thingsboard/thingsboard/issues
- **Stack Overflow**: Tag questions with `thingsboard`
- **LinkedIn**: https://www.linkedin.com/company/thingsboard/

### Stay Updated

- Watch the repository for updates
- Follow ThingsBoard on [LinkedIn](https://www.linkedin.com/company/thingsboard/posts/?feedView=all)
- Read the [Blog](https://thingsboard.io/blog/) for announcements

## License

By contributing to ThingsBoard, you agree that your contributions will be licensed under the [Apache License 2.0](./LICENSE).

---

Thank you for contributing to ThingsBoard! 🚀
