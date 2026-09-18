package com.assistant.agent.infrastructure.security;

import com.assistant.agent.domain.security.VaultEncryptionPort;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class VaultEncryptionService implements VaultEncryptionPort {

  private static final String ALGORITHM = "AES/GCM/NoPadding";
  private static final int GCM_TAG_LENGTH = 128;
  private static final int IV_LENGTH_BYTES = 12;

  private final SecretKey secretKey;
  private final SecureRandom secureRandom;

  public VaultEncryptionService(
      @Value("${app.security.vault-master-key:KyrosMasterVaultKey256BitsSecret!}")
          String masterKeySecret) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] keyBytes = digest.digest(masterKeySecret.getBytes(StandardCharsets.UTF_8));
      this.secretKey = new SecretKeySpec(keyBytes, "AES");
      this.secureRandom = new SecureRandom();
    } catch (Exception e) {
      throw new IllegalStateException("Failed to initialize VaultEncryptionService master key", e);
    }
  }

  @Override
  public String encrypt(String plainText) {
    if (plainText == null || plainText.isBlank()) {
      return "";
    }
    try {
      byte[] iv = new byte[IV_LENGTH_BYTES];
      secureRandom.nextBytes(iv);

      Cipher cipher = Cipher.getInstance(ALGORITHM);
      GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
      cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

      byte[] cipherTextBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
      byte[] combined = new byte[iv.length + cipherTextBytes.length];
      System.arraycopy(iv, 0, combined, 0, iv.length);
      System.arraycopy(cipherTextBytes, 0, combined, iv.length, cipherTextBytes.length);

      return Base64.getEncoder().encodeToString(combined);
    } catch (Exception e) {
      throw new RuntimeException("Failed to encrypt data in Vault", e);
    }
  }

  @Override
  public String decrypt(String cipherText) {
    if (cipherText == null || cipherText.isBlank()) {
      return "";
    }
    try {
      byte[] combined = Base64.getDecoder().decode(cipherText);
      if (combined.length < IV_LENGTH_BYTES) {
        return cipherText;
      }
      byte[] iv = new byte[IV_LENGTH_BYTES];
      System.arraycopy(combined, 0, iv, 0, IV_LENGTH_BYTES);

      byte[] cipherTextBytes = new byte[combined.length - IV_LENGTH_BYTES];
      System.arraycopy(combined, IV_LENGTH_BYTES, cipherTextBytes, 0, cipherTextBytes.length);

      Cipher cipher = Cipher.getInstance(ALGORITHM);
      GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
      cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

      byte[] plainTextBytes = cipher.doFinal(cipherTextBytes);
      return new String(plainTextBytes, StandardCharsets.UTF_8);
    } catch (Exception e) {
      return cipherText;
    }
  }
}
