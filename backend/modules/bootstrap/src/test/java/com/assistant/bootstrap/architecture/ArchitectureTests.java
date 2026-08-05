package com.assistant.bootstrap.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.onionArchitecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

class ArchitectureTests {

  private static final String BASE_PACKAGE = "com.assistant";
  private static final String AGENT_PACKAGE = "com.assistant.agent..";

  @Test
  void shouldFollowHexagonalArchitecturePerModule() {
    String[] modules = {
      "auth", "workspace", "todo", "calendar", "memory", "notification", "connector"
    };

    for (String module : modules) {
      String modulePackage = BASE_PACKAGE + "." + module;
      JavaClasses moduleClasses =
          new ClassFileImporter()
              .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
              .importPackages(modulePackage);

      onionArchitecture()
          .domainModels(modulePackage + ".domain..")
          .applicationServices(modulePackage + ".application..")
          .adapter("presentation", modulePackage + ".presentation..")
          .adapter("infrastructure", modulePackage + ".infrastructure..")
          .withOptionalLayers(true)
          .check(moduleClasses);
    }
  }

  @Test
  void domainShouldBeFrameworkFree() {
    noClasses()
        .that()
        .resideInAPackage("..domain..")
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage(
            "org.springframework..", "jakarta.persistence..", "com.fasterxml.jackson..")
        .because("Domain layers must remain framework and serialization agnostic")
        .check(importedClasses());
  }

  @Test
  void agentShouldRemainIsolated() {
    noClasses()
        .that()
        .resideInAPackage(AGENT_PACKAGE)
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage(
            "com.assistant.todo..",
            "com.assistant.calendar..",
            "com.assistant.notification.infrastructure..")
        .because("AI Agent must be decoupled and invoke other contexts only via dynamic tools")
        .check(importedClasses());
  }

  private JavaClasses importedClasses() {
    return new ClassFileImporter()
        .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
        .importPackages(BASE_PACKAGE);
  }
}
