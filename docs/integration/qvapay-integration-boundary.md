# QvaPay Integration Boundary

## Objetivo

Definir qué debe conocerse y validarse antes de implementar la integración real.

## Contrato requerido

La investigación técnica deberá determinar:

1. endpoint oficial para obtener ofertas P2P;
2. método HTTP;
3. autenticación;
4. parámetros;
5. paginación;
6. campos de una oferta;
7. identificación de BUY y SELL;
8. identificación de mercado/moneda;
9. rate y cantidades;
10. límites de frecuencia;
11. códigos de error;
12. comportamiento ante timeouts;
13. condiciones de disponibilidad.

## Regla arquitectónica

Ninguna respuesta externa se utilizará directamente como modelo de dominio.

```
QvaPay Response
      ↓
Schema Validation
      ↓
QvaPay Mapper
      ↓
Internal Offer
      ↓
Domain
```

## Estado

TBD hasta validar la documentación y comportamiento real de QvaPay.