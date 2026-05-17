-- Seed: manuals_raw  (from Inventory Manuals for RAG.xlsx)
-- IMPORTANT: We intentionally DO NOT load `confidential_info` into the vector
-- store. It contains wholesale costs and master reset codes that must never
-- be retrievable by the AI Agent.

insert into public.manuals_raw (product_name, category, content, version, last_updated) values
  (
    'X-1000 Power Processor',
    'Electronics',
    'TECHNICAL SPECIFICATIONS: Clock Speed: 3.5GHz (Base) / 5.2GHz (Boost). TDP: 120W. Socket: AM5. CAUTION: Exceeding 95C will trigger thermal throttling. WARRANTY: 3-year limited warranty.',
    '1.2',
    '2024-05-12'
  ),
  (
    'G-Pro Graphics Card',
    'Electronics',
    'TROUBLESHOOTING: If fans do not spin on startup, ensure both 8-pin power connectors are seated. Zero-RPM mode is active until 60C. FIRMWARE: Use v2.1 for AI acceleration stability.',
    '2.1',
    '2024-08-20'
  ),
  (
    'Industrial Grade Sensor',
    'Components',
    'CALIBRATION STEPS: 1. Power on with 24V DC. 2. Press ''Zero'' button for 5 seconds. 3. Adjust trim-pot until output is 4.00mA. DATA INTERFACE: RS-485 Modbus RTU.',
    '1.0',
    '2023-11-05'
  ),
  (
    'High-Speed Cooling Fan',
    'Components',
    'MAINTENANCE: Clean blades every 6 months to maintain 2500 RPM efficiency. NOISE SPECS: 18dB at 40%, 32dB at 100%. MTBF: 50,000 hours.',
    '3.0',
    '2024-01-15'
  ),
  (
    'Secure Cloud Hub',
    'Networking',
    'SECURITY FEATURES: FIPS 140-2 Level 3 certified. Dedicated TPM 2.0 module. Remote wipe capable. INITIAL SETUP: Default IP 192.168.1.254.',
    '4.2',
    '2024-09-01'
  );
