---
title: 'Introducción a Reglas YARA'
description: 'Cómo crear reglas YARA para detectar amenazas.'
pubDate: '2025-12-23'
categories: ['Blue Team']
tags: ['yara', 'threat hunting', 'blue team']
heroImage: '../../assets/Portadas/iniciociber.png'
---

**YARA** es una herramienta esencial para identificar y clasificar malware basándose en patrones (secuencias de texto o bytes) en lugar de nombres de archivo o hashes. Permite crear reglas personalizadas para detectar amenazas que los antivirus tradicionales podrían ignorar.

Sus usos principales incluyen:
* **Análisis Post-Incidente:** Verificar si existen rastros de una amenaza en otros equipos.
* **Threat Hunting:** Búsqueda proactiva de familias de malware en la red.
* **Análisis de Memoria:** Escaneo de procesos activos y volcados de RAM.

## Estructura de una Regla

Una regla YARA se divide en tres secciones: Metadatos, Strings (lo que buscas) y Condición (lógica de detección).

<div style="background-color: #1e1e1e; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-family: 'Consolas', 'Monaco', monospace; margin: 20px 0; overflow: hidden;">
  <div style="background-color: #323232; padding: 8px 12px; display: flex; align-items: center; border-bottom: 1px solid #444;">
    <span style="height: 12px; width: 12px; background-color: #ff5f56; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
    <span style="height: 12px; width: 12px; background-color: #ffbd2e; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
    <span style="height: 12px; width: 12px; background-color: #27c93f; border-radius: 50%; display: inline-block;"></span>
    <span style="margin-left: 10px; color: #aaa; font-size: 12px;">editor -- webshell_rule.yar</span>
  </div>
  <div style="padding: 15px; color: #d4d4d4; font-size: 14px; line-height: 1.5;">
    <span style="color: #569cd6;">rule</span> <span style="color: #4ec9b0;">Detectar_Webshell_PHP</span> {<br>
    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">meta</span>:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;description = <span style="color: #ce9178;">"Detecta funciones exec en PHP"</span><br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;author = <span style="color: #ce9178;">"BlueTeam Analyst"</span><br>
    <br>
    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">strings</span>:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">$php_tag</span> = <span style="color: #ce9178;">"&lt;?php"</span><br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">$cmd</span> = <span style="color: #ce9178;">"system("</span> <span style="color: #c586c0;">nocase</span><br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">$hex</span> = { 4D 5A } <span style="color: #6a9955;">// MZ Header</span><br>
    <br>
    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">condition</span>:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">$php_tag</span> <span style="color: #569cd6;">and</span> (<span style="color: #9cdcfe;">$cmd</span> <span style="color: #569cd6;">or</span> <span style="color: #9cdcfe;">$hex</span>)<br>
    }
  </div>
</div>

---

## 1. Strings (Definición de patrones)

Es donde defines qué buscar, es decir, definimos los patrones de la búsqueda. Hay tres tipos principales:

### A. Cadenas de Texto
Por defecto distinguen mayúsculas de minúsculas (*case-sensitive*). Se pueden alterar con modificadores:

| Modificador | Descripción | Ejemplo |
| :--- | :--- | :--- |
| **nocase** | Ignora mayúsculas/minúsculas | `"Error" nocase` |
| **wide** | Busca caracteres de 2 bytes (Unicode) | `"string" wide` |
| **ascii** | Fuerza búsqueda de 1 byte (estándar) | `"string" wide ascii` |
| **xor** | Busca variaciones XOR de 1 byte | `"payload" xor` |
| **base64** | Busca la cadena codificada en Base64 | `"powershell" base64` |

### B. Cadenas Hexadecimales (Hex Strings)
Para buscar bytes crudos, útil para cabeceras de archivos o shellcode. Se usan llaves `{}`.
* **Ejemplo:** `$mz_header = { 4D 5A 90 00 }`
* **Comodines:** Se puede usar `??` para bytes desconocidos: `{ E3 41 ?? C8 }`

### C. Expresiones Regulares (Regex)
Para patrones flexibles (IPs, emails, variaciones de comandos). Se usan barras `/`.
* **Ejemplo:** `$url_pattern = /http:\/\/.*\.com/`

---

## 2. Conditions (Lógica de detección)

Determina cuándo salta la alerta basándose en los strings encontrados.

* **Coincidencia básica:**
    * `$s1` (Si encuentra la variable s1).
    * `any of them` (Si encuentra cualquiera de las strings definidas).
    * `all of them` (Deben aparecer todas).
* **Operadores lógicos:** `and`, `or`, `not`.
    * Ejemplo: `($a or $b) and not $clean_file`
* **Propiedades del archivo:**
    * `filesize < 500KB` (Solo archivos menores a 500KB).
    * `entrypoint` (Para ejecutables PE).

---

## 3. Ejecución en Terminal

Comandos esenciales para lanzar YARA desde la línea de comandos (CLI).

<div style="background-color: #1e1e1e; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-family: 'Consolas', 'Monaco', monospace; margin: 20px 0; overflow: hidden;">
  <div style="background-color: #323232; padding: 8px 12px; display: flex; align-items: center; border-bottom: 1px solid #444;">
    <span style="height: 12px; width: 12px; background-color: #ff5f56; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
    <span style="height: 12px; width: 12px; background-color: #ffbd2e; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
    <span style="height: 12px; width: 12px; background-color: #27c93f; border-radius: 50%; display: inline-block;"></span>
    <span style="margin-left: 10px; color: #aaa; font-size: 12px;">bash -- kali@thm</span>
  </div>
  <div style="padding: 15px; color: #f8f8f2; font-size: 14px; line-height: 1.5;">
    <span style="color: #27c93f;">kali@thm</span>:<span style="color: #569cd6;">~</span>$ yara regla.yar archivo_sospechoso.php<br>
    <span style="color: #aaa;">// Escaneo recursivo de un directorio completo:</span><br>
    <span style="color: #27c93f;">kali@thm</span>:<span style="color: #569cd6;">~</span>$ yara -r webshells.yar /var/www/html<br>
    <br>
    <span style="color: #aaa;">// Mostrar exactamente qué string activó la alerta (-s):</span><br>
    <span style="color: #27c93f;">kali@thm</span>:<span style="color: #569cd6;">~</span>$ yara -s ransomware.yar invoice.exe<br>
    <span style="color: #ff5f56;">Ransomware_WannaCry</span> invoice.exe<br>
    0x400: $ms_sec_service: mssecsvc2.0<br>
  </div>
</div>
