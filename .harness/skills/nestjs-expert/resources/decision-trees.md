# Nest.js Decision Trees, Tooling & Performance

source: split from SKILL.md on 2026-06-09

## Tool Integration

### Diagnostic Tools
```bash
# Analyze module dependencies
nest info

# Check for circular dependencies
npm run build -- --watch=false

# Validate module structure
npm run lint
```

### Fix Validation
```bash
# Verify fixes (validation order)
npm run build          # 1. Typecheck first
npm run test           # 2. Run unit tests
npm run test:e2e       # 3. Run e2e tests if needed
```

**Validation order**: typecheck → unit tests → integration tests → e2e tests

## Decision Trees for Architecture

### Choosing Database ORM
```
Project Requirements:
├─ Need migrations? → TypeORM or Prisma
├─ NoSQL database? → Mongoose
├─ Type safety priority? → Prisma
├─ Complex relations? → TypeORM
└─ Existing database? → TypeORM (better legacy support)
```

### Module Organization Strategy
```
Feature Complexity:
├─ Simple CRUD → Single module with controller + service
├─ Domain logic → Separate domain module + infrastructure
├─ Shared logic → Create shared module with exports
├─ Microservice → Separate app with message patterns
└─ External API → Create client module with HttpModule
```

### Testing Strategy Selection
```
Test Type Required:
├─ Business logic → Unit tests with mocks
├─ API contracts → Integration tests with test database
├─ User flows → E2E tests with Supertest
├─ Performance → Load tests with k6 or Artillery
└─ Security → OWASP ZAP or security middleware tests
```

### Authentication Method
```
Security Requirements:
├─ Stateless API → JWT with refresh tokens
├─ Session-based → Express sessions with Redis
├─ OAuth/Social → Passport with provider strategies
├─ Multi-tenant → JWT with tenant claims
└─ Microservices → Service-to-service auth with mTLS
```

### Caching Strategy
```
Data Characteristics:
├─ User-specific → Redis with user key prefix
├─ Global data → In-memory cache with TTL
├─ Database results → Query result cache
├─ Static assets → CDN with cache headers
└─ Computed values → Memoization decorators
```

## Performance Optimization

### Caching Strategies
- Use built-in cache manager for response caching
- Implement cache interceptors for expensive operations
- Configure TTL based on data volatility
- Use Redis for distributed caching

### Database Optimization
- Use DataLoader pattern for N+1 query problems
- Implement proper indexes on frequently queried fields
- Use query builder for complex queries vs. ORM methods
- Enable query logging in development for analysis

### Request Processing
- Implement compression middleware
- Use streaming for large responses
- Configure proper rate limiting
- Enable clustering for multi-core utilization

## External Resources

### Core Documentation
- [Nest.js Documentation](https://docs.nestjs.com)
- [Nest.js CLI](https://docs.nestjs.com/cli/overview)
- [Nest.js Recipes](https://docs.nestjs.com/recipes)

### Testing Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### Database Resources
- [TypeORM Documentation](https://typeorm.io)
- [Mongoose Documentation](https://mongoosejs.com)

### Authentication
- [Passport.js Strategies](http://www.passportjs.org)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
