# Infrastructure

# School Financial Monitoring System

Version: 0.1
Status: MVP Infrastructure Strategy

---

# 1. Purpose

This document defines the infrastructure strategy for the School Financial Monitoring System.

The primary objective is to provide a reliable production system while keeping recurring infrastructure costs as low as reasonably possible.

The project is privately funded during development and initial operation.

Therefore, infrastructure must follow a cost-conscious approach.

---

# 2. Infrastructure Principles

The MVP infrastructure must prioritize:

1. Low recurring cost.
2. Simplicity.
3. Reliability.
4. Security.
5. Ease of maintenance.
6. Easy migration/scaling when required.

The system must not introduce infrastructure complexity without a demonstrated requirement.

---

# 3. Development Environment

Development must be possible entirely on the developer's local machine.

Required local infrastructure:

    Docker
    Docker Compose
    Django
    PostgreSQL

Development does not require:

    VPS
    Cloud hosting
    Managed PostgreSQL
    Redis
    Celery
    Kubernetes
    CDN
    External frontend hosting

Target recurring development infrastructure cost:

    Rp0 / month

---

# 4. Production MVP Architecture

The MVP should use a single VPS.

Architecture:

    Internet
       │
       ▼
    Domain
       │
       ▼
    HTTPS
       │
       ▼
    Nginx
       │
       ▼
    Gunicorn
       │
       ▼
    Django
       │
       ▼
    PostgreSQL

The Django application and PostgreSQL database may run on the same VPS during the MVP stage.

---

# 5. Production Components

## 5.1 VPS

The MVP requires one VPS.

Recommended starting specification:

    2 vCPU
    2 GB RAM
    40–50 GB SSD
    Linux

The exact provider is not part of the application architecture.

The provider should be selected based on:

- monthly price;
- reliability;
- Indonesian/nearby network latency;
- backup options;
- support;
- ease of management.

Do not select a provider solely based on the cheapest advertised price.

---

# 6. Expected Resource Requirements

The application workload is expected to be relatively light.

The primary workload consists of:

    Branch users
        ↓
    Data entry
        ↓
    PostgreSQL writes

and:

    Central users
        ↓
    Dashboard
        ↓
    PostgreSQL reads

The MVP does not require:

- GPU;
- machine learning inference;
- video processing;
- large file processing;
- high-frequency API traffic;
- real-time collaboration.

Therefore, a small VPS is expected to be sufficient initially.

---

# 7. Scaling Strategy

Do not provision large infrastructure before actual demand exists.

Start with:

    1 VPS

Scale only when monitoring demonstrates a real bottleneck.

Possible future progression:

    Stage 1
    Single VPS

        ↓

    Stage 2
    Larger VPS

        ↓

    Stage 3
    Separate database / application resources

        ↓

    Stage 4
    Additional infrastructure if genuinely required

The project should scale based on measured requirements rather than assumptions.

---

# 8. Database

Production database:

    PostgreSQL

For MVP:

    PostgreSQL runs on the same VPS as Django.

The database must not be publicly exposed to the Internet.

PostgreSQL should only accept connections from the application/server network.

---

# 9. Database Storage

Database data must be stored on persistent storage.

The PostgreSQL data directory must not depend on ephemeral container storage.

Docker volumes or equivalent persistent storage must be used.

---

# 10. Backup

Backups are mandatory.

Minimum MVP backup strategy:

    PostgreSQL
        ↓
    Scheduled database dump
        ↓
    Separate storage location

Backups must not exist only on the same VPS.

If the VPS fails completely, the backup must remain recoverable.

---

# 11. Backup Frequency

Recommended MVP:

    Daily database backup

Retention target:

    Minimum 7 daily backups

A longer retention period may be introduced later.

---

# 12. Restore Testing

A backup is not considered reliable until it has been restored successfully.

At least periodically:

    Backup
       ↓
    Restore to temporary database
       ↓
    Verify data
       ↓
    Record result

Restore procedures should be documented.

---

# 13. Domain

The system should use a proper domain or subdomain.

Preferred:

    monitoring.<existing-foundation-domain>

If the organization already owns a domain, use a subdomain rather than purchasing another domain.

Example:

    monitoring.example.org

This avoids unnecessary recurring domain costs.

---

# 14. HTTPS

Production must use HTTPS.

Use:

    Let's Encrypt

No paid SSL certificate is required for the MVP.

Architecture:

    HTTPS
       ↓
    Nginx
       ↓
    Django

HTTP should redirect to HTTPS.

---

# 15. Nginx

Nginx acts as the production reverse proxy.

Responsibilities:

- TLS termination;
- reverse proxy;
- static file serving;
- request forwarding;
- basic security headers.

Nginx is not required as a development service.

---

# 16. Gunicorn

Django production requests should be served through Gunicorn.

Architecture:

    Nginx
       ↓
    Gunicorn
       ↓
    Django

Django's development server must not be used for production.

---

# 17. Static Files

Static files should be served efficiently.

The MVP may use:

    Nginx

or:

    WhiteNoise

depending on the final deployment configuration.

Do not introduce a separate object-storage service solely for static files.

---

# 18. Media / File Uploads

File uploads are outside the MVP scope.

Therefore, the MVP does not require:

    S3
    object storage
    CDN
    media processing infrastructure

If document uploads are introduced later, storage architecture must be evaluated separately.

---

# 19. Redis

Redis is not required for the MVP.

Do not introduce Redis unless a demonstrated requirement appears.

Potential future uses:

- caching;
- background jobs;
- rate limiting;
- task queues.

These are explicitly outside the MVP infrastructure.

---

# 20. Celery / Background Workers

Celery is not required for the MVP.

The application does not currently require:

- asynchronous task processing;
- scheduled background processing;
- large job queues.

If a future requirement introduces background jobs, evaluate the infrastructure cost before adding a worker system.

---

# 21. Frontend Hosting

The frontend must not be deployed separately.

The MVP uses:

    Django Templates
    +
    HTMX
    +
    Tailwind CSS

Therefore:

    Frontend
        ↓
    Django

No separate:

    React server
    Next.js server
    Vercel deployment
    Netlify deployment

is required.

---

# 22. API Infrastructure

The MVP does not require a public REST API.

The primary application architecture is:

    Browser
       ↓
    Django
       ↓
    PostgreSQL

An API may be introduced later if another client requires it.

---

# 23. Monitoring

The MVP should begin with lightweight monitoring.

Minimum:

- application health endpoint;
- server resource monitoring;
- PostgreSQL availability;
- disk usage;
- backup status.

Do not introduce expensive observability platforms unless required.

---

# 24. Logging

Application logs should be retained sufficiently to diagnose errors.

Logs must not contain:

- passwords;
- authentication secrets;
- database passwords;
- sensitive credentials.

Log rotation must be configured in production.

---

# 25. Security

Production infrastructure must implement:

- HTTPS;
- firewall;
- SSH key authentication where possible;
- disabled root password login where practical;
- restricted PostgreSQL access;
- secure environment variables;
- regular operating system updates;
- regular application updates.

---

# 26. Secrets

Production secrets must never be committed to Git.

Examples:

    SECRET_KEY
    DATABASE_PASSWORD
    SSH credentials
    backup credentials

Use:

    .env

or an appropriate secret-management mechanism.

---

# 27. Firewall

Only required public ports should be exposed.

Typical:

    80
    443

SSH should be restricted appropriately.

PostgreSQL:

    5432

must not be publicly exposed.

---

# 28. Cost Strategy

The MVP infrastructure should target:

    Approximately Rp50,000–Rp100,000 / month

This is a target rather than a hard guarantee.

Actual cost depends on:

- VPS provider;
- exchange rate;
- domain ownership;
- backup storage;
- bandwidth;
- additional services.

---

# 29. Cost Priorities

Priority order:

    1. Security
    2. Data backup
    3. Application availability
    4. Server capacity
    5. Convenience

Do not sacrifice backups or security merely to save a small amount of money.

---

# 30. Infrastructure Cost Ownership

Development infrastructure may initially be privately funded.

Production infrastructure should be treated as an operational cost of the system.

The developer should not be assumed to permanently subsidize production infrastructure.

After the system is accepted for operational use, infrastructure ownership and payment responsibility should be explicitly agreed with the organization.

---

# 31. Development vs Production

Development:

    Laptop
    Docker
    PostgreSQL
    Django

Target:

    Rp0 recurring infrastructure

Production:

    VPS
    Nginx
    Gunicorn
    Django
    PostgreSQL
    Backup

Target:

    Rp50,000–Rp100,000 / month

---

# 32. Infrastructure Not Allowed Without Justification

The following must not be added solely for architectural fashion:

- Kubernetes;
- microservices;
- managed database;
- Redis;
- Celery;
- separate frontend hosting;
- CDN;
- load balancer;
- service mesh;
- cloud-native orchestration;
- paid monitoring platform.

Any addition requires a documented technical justification.

---

# 33. Upgrade Triggers

Infrastructure should be reconsidered when one or more of the following occur:

- sustained high CPU usage;
- sustained memory pressure;
- insufficient disk space;
- PostgreSQL performance degradation;
- significant increase in concurrent users;
- backup duration becomes problematic;
- application downtime becomes unacceptable;
- organizational requirements change.

Do not scale infrastructure merely because the application has been deployed.

---

# 34. Initial Production Architecture

Final MVP target:

    ┌─────────────────────────────┐
    │          INTERNET           │
    └──────────────┬──────────────┘
                   │
                   ▼
              ┌─────────┐
              │ Domain  │
              └────┬────┘
                   │
                   ▼
              ┌─────────┐
              │  Nginx  │
              │  HTTPS  │
              └────┬────┘
                   │
                   ▼
             ┌────────────┐
             │  Gunicorn  │
             └─────┬──────┘
                   │
                   ▼
             ┌────────────┐
             │   Django   │
             └─────┬──────┘
                   │
                   ▼
             ┌────────────┐
             │ PostgreSQL │
             └─────┬──────┘
                   │
                   │ Daily Backup
                   ▼
             ┌────────────┐
             │  External  │
             │   Backup   │
             │  Storage   │
             └────────────┘

All components except external backup storage may initially run on a single VPS.

---

# 35. Deployment Principle

The infrastructure should remain boring.

The system is a CRUD and monitoring application.

Infrastructure complexity should not exceed the actual application requirements.

The preferred MVP architecture is:

    Simple
    Secure
    Cheap
    Recoverable
    Maintainable