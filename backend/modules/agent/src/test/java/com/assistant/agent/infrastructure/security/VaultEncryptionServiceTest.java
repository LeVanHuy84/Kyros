package com.assistant.agent.infrastructure.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class VaultEncryptionServiceTest {

  private VaultEncryptionService vaultService;

  @BeforeEach
  void setUp() {
    vaultService = new VaultEncryptionService("TestMasterKey256BitsSecretKey12345");
  }

  @Test
  void shouldEncryptAndDecryptPlainTextSuccessfully() {
    String originalApiKey = "gsk_1234567890abcdefghijklmnopqrstuvwxyz";

    String encrypted = vaultService.encrypt(originalApiKey);

    assertNotNull(encrypted);
    assertFalse(encrypted.isBlank());
    assertNotEquals(originalApiKey, encrypted);

    String decrypted = vaultService.decrypt(encrypted);

    assertEquals(originalApiKey, decrypted);
  }

  @Test
  void shouldHandleEmptyOrNullInputGracefully() {
    assertEquals("", vaultService.encrypt(""));
    assertEquals("", vaultService.encrypt(null));
    assertEquals("", vaultService.decrypt(""));
    assertEquals("", vaultService.decrypt(null));
  }
}
