package com.assistant.agent.domain.security;

public interface VaultEncryptionPort {

  String encrypt(String plainText);

  String decrypt(String cipherText);
}
