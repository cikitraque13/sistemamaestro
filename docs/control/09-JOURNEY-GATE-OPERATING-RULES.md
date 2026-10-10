# Journey Gate Operating Rules

## Autoridad y alcance

Estas reglas gobiernan cómo abrir, ejecutar, revisar y cerrar gates. No describen el estado de cada gate ni autorizan una mutación. El [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) es el único owner del roadmap y sus estados.

HUMAN-LUCAS conserva la autoridad para producción: un resultado técnico favorable no autoriza por sí mismo merge, deployment, cambio productivo ni efecto económico.

## Secuencia de trabajo

1. Inspect before modify: comprobar identidad, estado y superficie antes de cambiarla.
2. Design before implementation: aclarar alcance, invariantes, riesgos y aceptación antes de escribir.
3. Reducir incertidumbre: una incertidumbre → una acción → una evidencia → una decisión.
4. Reabrir gates mediante delta audit, no por antigüedad ni intuición.
5. Mantener un escritor por archivo y un owner por subproblema.
6. No repetir investigaciones ya cerradas si la evidencia conserva validez.

## Regla central de delta

```text
ORIGINAL_GATE
+ CURRENT_CANONICAL_STATE
+ ACCREDITED_EVIDENCE
+ CHANGES_SINCE_EVIDENCE
= DELTA_TO_PROVE
```

Definir el delta antes de ejecutar. Probar únicamente lo que cambió y las dependencias que esas diferencias puedan invalidar.

## Reutilización e invalidación de evidencia

La evidencia se reutiliza solo si coinciden identidad (commit/tree/artefacto), alcance, configuración, runtime, entorno, método, comandos y criterios requeridos por el gate receptor. Registrar procedencia y límites.

Invalidar la evidencia afectada cuando cambie un elemento relevante: código/tree, dependencias o lockfile, runtime/toolchain, configuración/env, artefacto, entorno/target, harness/método, superficie de seguridad o criterios de aceptación. Aplicar revisión de delta; no repetir pruebas no afectadas.

Un resultado solo prueba lo que observó. La ausencia de errores observados no prueba ausencia universal de errores; OAuth exitoso no acredita por sí solo autorización de todos los endpoints o aislamiento.

## Independencia de QA y revisión de seguridad

QA debe ser independiente de la implementación y recibir identidad, artefacto, criterios y evidence necesarios para reproducir o falsificar claims. No hereda un PASS por similitud o por el veredicto del implementador.

Activar Security cuando el cambio o amenaza involucre auth, owner/project, permisos, secretos, SSRF, herramientas externas, pagos/Gems/ledger, autorización de Builder, replay, datos o límites cloud. Security debe revisar el scope y la identidad exactos; no presentar un veredicto acotado como certificación global.

Las mutaciones de Builder mantienen la frontera acreditada: salida no confiable → validación/review → decisión humana → autorización explícita, única y ligada a owner/revisión/candidate/artifact/decision → apply atómico. Rechazar stale/replay; un fallo no cambia el estado activo. No extrapolar esa garantía fuera de su scope probado.

## Cierre de Journey

Un gate resuelve su responsabilidad concreta, preserva las garantías alcanzadas y entrega una base mejor a la siguiente etapa.

Un journey se cierra conforme a sus criterios explícitos, evidencia requerida, revisión independiente y reconciliación documental. Cuando HUMAN-LUCAS acepta expresamente un cierre humano limitado a un alcance identificado, registrar `CLOSED_BY_HUMAN_ACCEPTANCE`, el alcance aceptado y sus limitaciones. Ese estado no equivale a `TECHNICAL_PASS` ni acredita criterios o comportamientos no observados. La aceptación humana de un alcance no transfiere `PASS` a criterios no observados ni a gates posteriores. Registrar riesgos y evidencia faltante; no marcar otros alcances como cerrados por inferencia ni reabrirlos sin contradicción o delta material.

## Documentación y checkpoints

Reconciliar documentos canónicos después de un cambio aprobado y antes de crear el checkpoint semántico correspondiente. Un owner por hecho: los índices enlazan, no duplican el estado. Mantener historia válida con etiquetas temporales; corregir solo claims vigentes obsoletos.

Workspace hygiene es salud del proyecto: separar fuente, regenerables, evidencia y backups; clasificar antes de mover/eliminar; no introducir secretos o temporales en el repo.

## Gold Freeze

Crear Gold Freeze solo en checkpoints semánticos aprobados. El freeze es inmutable: nunca sobrescribir, “limpiar” o reutilizar su identidad. Usar allowlist positiva, exclusión de secretos y regenerables, manifest con SHA-256 por archivo y digest determinista.

Verificar conteo, hashes, estructura y restore aislado. Distinguir lo que acredita el manifest de pruebas externas, como restore proof. Registrar commit/tree y evidencia vinculada. Un Gold es recovery/evidence, no mecanismo normal de rollback productivo.

## No duplicación ni reauditoría innecesaria

El documento owner contiene la verdad detallada; otros documentos enlazan y resumen solo lo necesario para su función. Antes de repetir un gate, comparar su baseline y evidencia con el estado actual y definir DELTA_TO_PROVE. Si no existe delta material, conservar el cierre y documentar por qué la evidencia sigue siendo aplicable.