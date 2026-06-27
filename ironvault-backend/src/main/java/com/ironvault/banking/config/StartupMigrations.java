package com.ironvault.banking.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Runs idempotent schema fixes on startup.
 *
 * Hibernate's {@code ddl-auto=update} cannot widen an existing VARCHAR column,
 * so we explicitly ALTER columns here when they are shorter than what the
 * entity declares. Each migration is a no-op if the column is already wide enough.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StartupMigrations {

    private final JdbcTemplate jdbcTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @EventListener(ApplicationReadyEvent.class)
    @Order(0)
    @Transactional
    public void widenEnumColumns() {
        ensureVarcharAtLeast("loans", "status", 32);
        ensureVarcharAtLeast("loans", "loan_type", 32);
    }

    private void ensureVarcharAtLeast(String table, String column, int targetLength) {
        String databaseProduct = dialectName();

        Integer currentSize = null;
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT CHARACTER_MAXIMUM_LENGTH AS len FROM information_schema.columns " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                    table, column);
            if (!rows.isEmpty() && rows.get(0).get("len") != null) {
                currentSize = ((Number) rows.get(0).get("len")).intValue();
            }
        } catch (Exception e) {
            log.debug("Could not introspect column {}.{} via information_schema: {}",
                    table, column, e.getMessage());
        }

        if (currentSize != null && currentSize >= targetLength) {
            log.debug("Skipping ALTER {}.{}: already VARCHAR({})", table, column, currentSize);
            return;
        }

        String alter;
        if ("MySQL".equalsIgnoreCase(databaseProduct) || "MariaDB".equalsIgnoreCase(databaseProduct)) {
            alter = "ALTER TABLE " + table + " MODIFY " + column + " VARCHAR(" + targetLength + ")";
        } else {
            alter = "ALTER TABLE " + table + " ALTER COLUMN " + column + " VARCHAR(" + targetLength + ")";
        }

        log.info("Startup migration: applying '{}' (was VARCHAR({}))", alter, currentSize);
        jdbcTemplate.execute(alter);
    }

    private String dialectName() {
        String dialect = String.valueOf(entityManager.getEntityManagerFactory()
                .getProperties()
                .getOrDefault("hibernate.dialect", ""));
        if (dialect.toLowerCase().contains("mariadb")) {
            return "MariaDB";
        }
        return "MySQL";
    }
}