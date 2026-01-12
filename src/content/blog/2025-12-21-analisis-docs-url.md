---
title: 'Análisis de Malware: Documentos y URLs'
description: 'Guía para analizar adjuntos y enlaces sospechosos (Blue Team).'
pubDate: '2025-12-21'
categories: ['Blue Team']
tags: ['malware', 'phishing', 'forense']
heroImage: '../../assets/Portadas/iniciociber.png'
slug: "scan-docs-urls"

---

A continuación se detallan los diferentes métodos y herramientas para verificar la legitimidad de archivos y enlaces web.

Las técnicas se clasifican según la sensibilidad de la información.

## 1. Análisis de Documentos (PDF y Office)

### Identificación Básica (Cualquier archivo)

| Objetivo | Herramienta | Descripción | Comando |
| :--- | :--- | :--- | :--- |
| Identificar tipo | file | Detecta la extensión real. | `file <archivo>` |
| Obtener Hash | sha256sum | Genera firma para buscar reputación online. | `sha256sum <archivo>` |

### Documento confidencial (Análisis Local / Sin Internet)

| Objetivo | Herramienta | Descripción | Comando |
| :--- | :--- | :--- | :--- |
| Detectar Macros | olevba | Extrae código VBA malicioso de Office. | `olevba <archivo>` |
| Triaje PDF | pdfid | Cuenta elementos peligrosos (/JS, /AA). | `pdfid <archivo>` |
| Explorar PDF | pdf-parser | Busca y decodifica scripts ocultos. | `pdf-parser --search javascript <archivo>` |
| Extraer Obj. | pdf-parser | Extrae contenido raw de un objeto (ID). | `pdf-parser -o <id> -r -f <archivo>` |
| Metadatos | exiftool | Muestra autor y software de creación. | `exiftool <archivo>` |
| Simular Red | FakeNet-NG | Captura peticiones C2 sin salir a internet. | `fakenet` (En VM) |

### Documento público (Solo archivos genéricos)

| Objetivo | Herramienta | Descripción |
| :--- | :--- | :--- |
| Sandbox Visual | Any.Run | Ejecución interactiva en la nube. |
| Reporte Completo | Hybrid Analysis | Análisis detallado de comportamiento y red. |

## 2. Análisis de URLs

### URL confidencial (Spear Phishing / Tokens)

Métodos pasivos o sin ejecución de código.

| Objetivo | Herramienta | Descripción | Comando |
| :--- | :--- | :--- | :--- |
| Decodificar | CyberChef | Limpia URLs ofuscadas (Base64, %20). | - |
| Info Dominio | whois | Consulta fecha de creación del dominio. | `whois <dominio>` |
| IP del servidor | dig | Obtiene la IP sin conectar por HTTP. | `dig <dominio> +short` |
| Visita Segura | curl | Pide cabeceras sin ejecutar scripts. | `curl -I -L --user-agent "Mozilla/5.0" "<url>"` |

### URL Pública (Spam)

| Objetivo | Herramienta | Descripción |
| :--- | :--- | :--- |
| Ver la web | UrlScan.io | Captura de pantalla y código DOM remoto. |
| Reputación | VirusTotal | Consulta listas negras de antivirus. |
| Navegar | Browserling | Navegador desechable online. |
