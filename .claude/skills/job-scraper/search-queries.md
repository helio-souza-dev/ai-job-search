# Search Queries for Job Scraper

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; Danish demos and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

## Search Sites

Primary (your market's job boards):
- **linkedin.com/jobs** - LinkedIn job listings (filter: Brazil / São Paulo); also covered by `linkedin-search` CLI
- **gupy.io** - Gupy (muito usado no Brasil)
- **vagas.com.br** - Vagas.com.br
- **infojobs.com.br** - Infojobs

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies

## Query Categories

Queries are grouped by priority. Each query should be combined with your location terms (e.g. your city, region, or metro area) where the site supports it.

### Priority 1: Estágio em Desenvolvimento Backend / Full-stack

These match your strongest and most desired career direction.

```
site:gupy.io "Estágio" "Desenvolvimento" "São Paulo"
site:vagas.com.br "Estágio Desenvolvedor Java" "São Paulo"
site:linkedin.com/jobs "Estágio Backend" "Brazil"
```

### Priority 2: Java & PHP Ecosystem

These match your domain expertise.

```
site:gupy.io "Estágio Java" OR "Estágio Spring Boot" "São Paulo"
site:gupy.io "Estágio PHP" "São Paulo"
site:linkedin.com/jobs "Estágio Java" "São Paulo" "Brazil"
```

### Priority 3: Estágio em Dados / Python

Adjacent roles you could pivot into.

```
site:gupy.io "Estágio Dados" "Python" "São Paulo"
site:vagas.com.br "Estágio Python" "São Paulo"
```

### Priority 4: Broader Technical / Consulting

Wider net for general technical roles.

```
site:gupy.io "Estágio TI" "São Paulo"
site:linkedin.com/jobs "Estágio Tecnologia" "São Paulo"
```

## Location Filter

When evaluating results, verify the job location is within reasonable commute distance from your home. Define acceptable areas:
- São Paulo (Capital) e arredores
- [Cidades Vizinhas ou sua Região Metropolitana]
- Remoto (qualquer lugar do Brasil)
- [Cidades mais distantes, apenas se for híbrido flexível]

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape [focus_area]" -> relevant category queries + custom focus-specific queries
