/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body - WiFi + LSM303DLHC (Accelerometer)
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <string.h>
#include <stdio.h>
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */
/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* --- TVOJE WIFI NASTAVITVE --- */
#define WIFI_SSID "Jan"
#define WIFI_PASS "banana123"

/* --- TVOJ SERVER --- */
#define TCP_HOST  "172.20.10.2"
#define TCP_PORT  8080

/* ESP Parametri */
#define ESP_RX_BUFFER_SIZE 1024U
#define ESP_CMD_TIMEOUT_MS 2000U
#define ESP_WIFI_TIMEOUT_MS 25000U
#define ESP_TCP_TIMEOUT_MS 10000U

/* --- LSM303DLHC DEFINICIJE (Iz tvoje kode) --- */
#define LSM303DLHC_ACC_ADDR  (0x19 << 1)
#define CTRL_REG1_A   0x20
#define CTRL_REG4_A   0x23
#define STATUS_REG_A  0x27
#define OUT_X_L_A     0x28
#define OUT_X_H_A     0x29
#define OUT_Y_L_A     0x2A
#define OUT_Y_H_A     0x2B
#define OUT_Z_L_A     0x2C
#define OUT_Z_H_A     0x2D
#define WHO_AM_I_A    0x0F

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */
/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
I2C_HandleTypeDef hi2c1; // Dodan I2C handle
SPI_HandleTypeDef hspi1;
UART_HandleTypeDef huart1;

/* USER CODE BEGIN PV */
static char esp_rx_buffer[ESP_RX_BUFFER_SIZE];

/* --- SPREMENLJIVKE ZA SENZOR --- */
int16_t accel_x, accel_y, accel_z;
uint8_t sensor_data[6];
uint8_t whoami = 0;

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_I2C1_Init(void);
static void MX_SPI1_Init(void);
static void MX_USART1_UART_Init(void);

/* USER CODE BEGIN PFP */
typedef enum {
  ESP_RES_OK = 0,
  ESP_RES_ERROR,
  ESP_RES_TIMEOUT
} esp_result_t;

// Pomožne funkcije za ESP
static void esp_set_leds(uint8_t at_ok, uint8_t wifi_ok, uint8_t tcp_ok, uint8_t send_ok);
static void esp_uart_flush(void);
static esp_result_t esp_wait_for(const char *ok1, const char *ok2, uint32_t timeout_ms);
static esp_result_t esp_send_cmd(const char *cmd, const char *ok1, const char *ok2, uint32_t timeout_ms);
static HAL_StatusTypeDef esp_setup_wifi(void);
static HAL_StatusTypeDef esp_open_tcp(void);
static HAL_StatusTypeDef esp_send_payload(const char *payload);

// --- FUNKCIJE ZA SENZOR ---
static void LSM303DLHC_Init(void);
static void LSM303DLHC_Read_Accel(void);

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

/* --- IMPLEMENTACIJA SENZOR FUNKCIJ--- */
void LSM303DLHC_Init(void)
{
  HAL_StatusTypeDef status;
  uint8_t config;

  // Preveri ID naprave
  status = HAL_I2C_Mem_Read(&hi2c1, LSM303DLHC_ACC_ADDR, WHO_AM_I_A, 1, &whoami, 1, 1000);

  // Inicializacija registrov
  config = 0x57; // 50Hz, Enable X/Y/Z
  HAL_I2C_Mem_Write(&hi2c1, LSM303DLHC_ACC_ADDR, CTRL_REG1_A, 1, &config, 1, 1000);
  HAL_Delay(10);

  config = 0x88; // Block Data Update, High Resolution
  HAL_I2C_Mem_Write(&hi2c1, LSM303DLHC_ACC_ADDR, CTRL_REG4_A, 1, &config, 1, 1000);
  HAL_Delay(10);
}

void LSM303DLHC_Read_Accel(void)
{
  HAL_StatusTypeDef status;
  status = HAL_I2C_Mem_Read(&hi2c1, LSM303DLHC_ACC_ADDR, OUT_X_L_A | 0x80, 1, sensor_data, 6, 1000);

  if(status == HAL_OK)
  {
    accel_x = (int16_t)((sensor_data[1] << 8) | sensor_data[0]);
    accel_y = (int16_t)((sensor_data[3] << 8) | sensor_data[2]);
    accel_z = (int16_t)((sensor_data[5] << 8) | sensor_data[4]);

    accel_x = accel_x >> 4;
    accel_y = accel_y >> 4;
    accel_z = accel_z >> 4;
  }
}
/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* USER CODE BEGIN 1 */
  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/
  HAL_Init();

  /* USER CODE BEGIN Init */
  /* USER CODE END Init */

  SystemClock_Config();

  /* USER CODE BEGIN SysInit */
  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_SPI1_Init();
  MX_USART1_UART_Init();

  /* USER CODE BEGIN 2 */
  // 1. Čakanje na zagon ESP-ja
  HAL_Delay(3000);

  // Inicializacija Senzorja
  LSM303DLHC_Init();

  esp_set_leds(0, 0, 0, 0);

  // 2. Preverjanje komunikacije (AT ukazi)
  uint8_t esp_connected = 0;
  for(int i=0; i<5; i++) {
      if (esp_send_cmd("AT\r\n", "OK", NULL, 1000) == ESP_RES_OK) {
          esp_connected = 1;
          break;
      }
      HAL_GPIO_TogglePin(GPIOE, LD10_Pin);
      HAL_Delay(1000);
  }

  if (esp_connected) {
      HAL_GPIO_WritePin(GPIOE, LD10_Pin, GPIO_PIN_RESET);
      esp_set_leds(1, 0, 0, 0); // LD3 (Modra) ON - ESP OK

      esp_send_cmd("ATE0\r\n", "OK", NULL, 1000);
      esp_send_cmd("AT+CWMODE=1\r\n", "OK", NULL, 1000);

      // 3. Povezava na WiFi
      if (esp_setup_wifi() == HAL_OK) {
          esp_set_leds(1, 1, 0, 0); // LD5 (Oranžna) ON - WiFi OK
      } else {
          while(1) {
              HAL_GPIO_TogglePin(GPIOE, LD5_Pin);
              HAL_Delay(200);
          }
      }
  } else {
      while(1) {
          HAL_GPIO_TogglePin(GPIOE, LD10_Pin);
          HAL_Delay(200);
      }
  }
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */

    // --- BRANJE SENZORJA ---
    LSM303DLHC_Read_Accel();

    // Pretvorba v G (približno, 1 mg/LSB v High Res)
    float acc_x_g = (float)accel_x / 1000.0f;
    float acc_y_g = (float)accel_y / 1000.0f;
    float acc_z_g = (float)accel_z / 1000.0f;

    // 4. Odpri TCP povezavo
    if (esp_open_tcp() == HAL_OK) {
      esp_set_leds(1, 1, 1, 0); // LD7 (Zelena) ON - TCP OK

      // Pripravi JSON sporočilo s podatki senzorja
      char payload[128];
      snprintf(payload, sizeof(payload), "{\"x\":%.2f,\"y\":%.2f,\"z\":%.2f}\n", acc_x_g, acc_y_g, acc_z_g);

      // 5. Pošlji podatke
      if (esp_send_payload(payload) == HAL_OK) {
        esp_set_leds(1, 1, 1, 1); // LD9 (Rdeča) ON - Poslano
        HAL_Delay(200);
        esp_set_leds(1, 1, 1, 0);
      }

      esp_send_cmd("AT+CIPCLOSE\r\n", "OK", NULL, 1000);
    }
    else {
      // Reconnect logika
      HAL_GPIO_TogglePin(GPIOE, LD7_Pin);
      if(esp_send_cmd("AT+CWJAP?\r\n", WIFI_SSID, NULL, 1000) != ESP_RES_OK) {
           esp_setup_wifi();
           esp_set_leds(1, 1, 0, 0);
      }
    }

    HAL_Delay(200); // Pošiljaj 5x na sekundo (hitreje kot prej, da vidiš premike)
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
  RCC_PeriphCLKInitTypeDef PeriphClkInit = {0};

  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL6;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_1) != HAL_OK)
  {
    Error_Handler();
  }

  PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USART1|RCC_PERIPHCLK_I2C1;
  PeriphClkInit.Usart1ClockSelection = RCC_USART1CLKSOURCE_PCLK2;
  PeriphClkInit.I2c1ClockSelection = RCC_I2C1CLKSOURCE_HSI;
  if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief I2C1 Initialization Function - ZA SENZOR
  * @param None
  * @retval None
  */
static void MX_I2C1_Init(void)
{
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x2000090E; // Standard timing za 100kHz na HSI
  hi2c1.Init.OwnAddress1 = 0;
  hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
  hi2c1.Init.OwnAddress2 = 0;
  hi2c1.Init.OwnAddress2Masks = I2C_OA2_NOMASK;
  hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
  hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
  if (HAL_I2C_Init(&hi2c1) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_I2CEx_ConfigAnalogFilter(&hi2c1, I2C_ANALOGFILTER_ENABLE) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_I2CEx_ConfigDigitalFilter(&hi2c1, 0) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief USART1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART1_UART_Init(void)
{
  huart1.Instance = USART1;
  huart1.Init.BaudRate = 115200;
  huart1.Init.WordLength = UART_WORDLENGTH_8B;
  huart1.Init.StopBits = UART_STOPBITS_1;
  huart1.Init.Parity = UART_PARITY_NONE;
  huart1.Init.Mode = UART_MODE_TX_RX;
  huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart1.Init.OverSampling = UART_OVERSAMPLING_16;
  huart1.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart1.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart1) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief SPI1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_SPI1_Init(void)
{
  hspi1.Instance = SPI1;
  hspi1.Init.Mode = SPI_MODE_MASTER;
  hspi1.Init.Direction = SPI_DIRECTION_2LINES;
  hspi1.Init.DataSize = SPI_DATASIZE_4BIT;
  hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
  hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
  hspi1.Init.NSS = SPI_NSS_SOFT;
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_4;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 7;
  hspi1.Init.CRCLength = SPI_CRC_LENGTH_DATASIZE;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOE_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOF_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOE, CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|LD5_Pin
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pins : DRDY_Pin MEMS_INT3_Pin MEMS_INT4_Pin MEMS_INT1_Pin
                           MEMS_INT2_Pin */
  GPIO_InitStruct.Pin = DRDY_Pin|MEMS_INT3_Pin|MEMS_INT4_Pin|MEMS_INT1_Pin
                          |MEMS_INT2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_EVT_RISING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /*Configure GPIO pins : CS_I2C_SPI_Pin LD4_Pin LD3_Pin LD5_Pin
                           LD7_Pin LD9_Pin LD10_Pin LD8_Pin
                           LD6_Pin */
  GPIO_InitStruct.Pin = CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|LD5_Pin
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);
}

/* USER CODE BEGIN 4 */
// --- ORIGINALNA WIFI LOGIKA (ki super dela) ---

static void esp_set_leds(uint8_t at_ok, uint8_t wifi_ok, uint8_t tcp_ok, uint8_t send_ok)
{
  HAL_GPIO_WritePin(GPIOE, LD3_Pin, at_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOE, LD5_Pin, wifi_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOE, LD7_Pin, tcp_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOE, LD9_Pin, send_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
}

static void esp_uart_flush(void)
{
  uint8_t ch = 0;
  while (HAL_UART_Receive(&huart1, &ch, 1, 0) == HAL_OK) {}
}

static esp_result_t esp_wait_for(const char *ok1, const char *ok2, uint32_t timeout_ms)
{
  uint32_t start = HAL_GetTick();
  size_t len = 0;
  uint8_t ch = 0;
  memset(esp_rx_buffer, 0, sizeof(esp_rx_buffer));

  while ((HAL_GetTick() - start) < timeout_ms) {
    if (HAL_UART_Receive(&huart1, &ch, 1, 5) == HAL_OK) {
      if (len < (ESP_RX_BUFFER_SIZE - 1U)) {
        esp_rx_buffer[len++] = (char)ch;
        esp_rx_buffer[len] = '\0';
      }
      if (strstr(esp_rx_buffer, "ERROR") || strstr(esp_rx_buffer, "FAIL")) return ESP_RES_ERROR;
      if ((ok1 && strstr(esp_rx_buffer, ok1)) || (ok2 && strstr(esp_rx_buffer, ok2))) return ESP_RES_OK;
    }
  }
  return ESP_RES_TIMEOUT;
}

static esp_result_t esp_send_cmd(const char *cmd, const char *ok1, const char *ok2, uint32_t timeout_ms)
{
  esp_uart_flush();
  if (HAL_UART_Transmit(&huart1, (uint8_t *)cmd, strlen(cmd), HAL_MAX_DELAY) != HAL_OK) return ESP_RES_ERROR;
  return esp_wait_for(ok1, ok2, timeout_ms);
}

static HAL_StatusTypeDef esp_setup_wifi(void)
{
  char cmd[128];
  snprintf(cmd, sizeof(cmd), "AT+CWJAP=\"%s\",\"%s\"\r\n", WIFI_SSID, WIFI_PASS);
  if (esp_send_cmd(cmd, "WIFI GOT IP", "OK", ESP_WIFI_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  if (esp_send_cmd("AT+CIPMUX=0\r\n", "OK", NULL, ESP_CMD_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  return HAL_OK;
}

static HAL_StatusTypeDef esp_open_tcp(void)
{
  char cmd[128];
  snprintf(cmd, sizeof(cmd), "AT+CIPSTART=\"TCP\",\"%s\",%u\r\n", TCP_HOST, TCP_PORT);
  if (esp_send_cmd(cmd, "CONNECT", "OK", ESP_TCP_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  return HAL_OK;
}

static HAL_StatusTypeDef esp_send_payload(const char *payload)
{
  char cmd[32];
  size_t len = strlen(payload);
  snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%lu\r\n", (unsigned long)len);
  if (esp_send_cmd(cmd, ">", NULL, ESP_CMD_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  if (HAL_UART_Transmit(&huart1, (uint8_t *)payload, len, HAL_MAX_DELAY) != HAL_OK) return HAL_ERROR;
  if (esp_wait_for("SEND OK", NULL, ESP_CMD_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  return HAL_OK;
}
/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  __disable_irq();
  while (1) {}
}
