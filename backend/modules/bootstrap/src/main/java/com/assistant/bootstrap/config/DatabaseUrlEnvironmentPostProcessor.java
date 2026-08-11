package com.assistant.bootstrap.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

  private static final String PROPERTY_SOURCE_NAME = "databaseAndRedisUrl";

  @Override
  public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
    Map<String, Object> properties = new HashMap<>();

    addDatabaseProperties(environment, properties);
    addRedisProperties(environment, properties);

    if (!properties.isEmpty()) {
      environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
    }
  }

  private void addDatabaseProperties(ConfigurableEnvironment environment, Map<String, Object> properties) {
    String databaseUrl = environment.getProperty("DATABASE_URL");
    if (databaseUrl == null || databaseUrl.isBlank()) {
      return;
    }

    if (environment.getProperty("spring.datasource.url") != null) {
      return;
    }

    try {
      URI uri = new URI(databaseUrl);
      String userInfo = uri.getUserInfo();
      String host = uri.getHost();
      int port = uri.getPort();
      String path = uri.getPath();

      if (host == null || path == null || path.isEmpty()) {
        return;
      }

      String user = null;
      String password = null;
      if (userInfo != null && !userInfo.isEmpty()) {
        int idx = userInfo.indexOf(':');
        if (idx >= 0) {
          user = userInfo.substring(0, idx);
          password = userInfo.substring(idx + 1);
        } else {
          user = userInfo;
        }
      }

      String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
      String query = uri.getQuery();
      if (query != null && !query.isEmpty()) {
        jdbcUrl += "?" + query;
      }

      properties.put("spring.datasource.url", jdbcUrl);
      if (user != null) {
        properties.put("spring.datasource.username", user);
      }
      if (password != null) {
        properties.put("spring.datasource.password", password);
      }
      properties.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
    } catch (URISyntaxException e) {
      throw new IllegalStateException("Failed to parse DATABASE_URL: " + databaseUrl, e);
    }
  }

  private void addRedisProperties(ConfigurableEnvironment environment, Map<String, Object> properties) {
    String redisUrl = environment.getProperty("REDIS_URL");
    if (redisUrl == null || redisUrl.isEmpty()) {
      return;
    }

    if (environment.getProperty("spring.data.redis.host") != null) {
      return;
    }

    try {
      URI uri = new URI(redisUrl);
      String userInfo = uri.getUserInfo();
      String host = uri.getHost();
      int port = uri.getPort();
      String scheme = uri.getScheme();

      if (host == null) {
        return;
      }

      if (!"redis".equals(scheme) && !"rediss".equals(scheme)) {
        return;
      }

      int redisPort = port > 0 ? port : ("rediss".equals(scheme) ? 6380 : 6379);

      properties.put("spring.data.redis.host", host);
      properties.put("spring.data.redis.port", redisPort);

      if (userInfo != null && !userInfo.isEmpty()) {
        String password = userInfo.startsWith(":") ? userInfo.substring(1) : userInfo;
        if (!password.isEmpty()) {
          properties.put("spring.data.redis.password", password);
        }
      }

      if ("rediss".equals(scheme)) {
        properties.put("spring.data.redis.ssl", true);
      }
    } catch (URISyntaxException e) {
      throw new IllegalStateException("Failed to parse REDIS_URL: " + redisUrl, e);
    }
  }
}
