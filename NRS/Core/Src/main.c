/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body - ESP32 WiFi AT Commands
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "usb_device.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include "usbd_cdc_if.h"
#include <stdio.h>
#include <string.h>

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

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

// WiFi Configuration
#define WIFI_SSID     "Jan's iPhone"
#define WIFI_PASSWORD "banana123"
#define SERVER_IP     "172.20.10.2"  // IP računalnika
#define SERVER_PORT   "8080"

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
I2C_HandleTypeDef hi2c1;

SPI_HandleTypeDef hspi1;

UART_HandleTypeDef huart1;

/* USER CODE BEGIN PV */

int16_t accel_x, accel_y, accel_z;
uint8_t sensor_data[6];
char usbBuffer[100];
uint8_t whoami = 0;

// ESP32 buffers
uint8_t esp_rx_buffer[512];
uint8_t esp_rx_byte;
uint16_t esp_rx_index = 0;
uint8_t esp_ready = 0;

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_I2C1_Init(void);
static void MX_SPI1_Init(void);
static void MX_USART1_UART_Init(void);
/* USER CODE BEGIN PFP */

uint8_t ESP32_Init(void);
void ESP32_SendCommand(char* cmd);
uint8_t ESP32_WaitResponse(char* expected, uint32_t timeout);
uint8_t ESP32_ConnectWiFi(void);
void ESP32_SendData(char* data);

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

void LSM303DLHC_Init(void)
{
  HAL_StatusTypeDef status;
  uint8_t config;

  status = HAL_I2C_Mem_Read(&hi2c1, LSM303DLHC_ACC_ADDR, WHO_AM_I_A, 1, &whoami, 1, 1000);

  // Če senzor ne dela, ne smemo ubiti programa, samo ignoriramo za zdaj
  if(status != HAL_OK || whoami != 0x33)
  {
    // Sensor error handling
  }

  config = 0x57;
  HAL_I2C_Mem_Write(&hi2c1, LSM303DLHC_ACC_ADDR, CTRL_REG1_A, 1, &config, 1, 1000);
  HAL_Delay(10);

  config = 0x88;
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

// --- POPRAVLJENE ESP FUNKCIJE ---

void ESP32_SendCommand(char* cmd)
{
  HAL_UART_Transmit(&huart1, (uint8_t*)cmd, strlen(cmd), 1000);
  // ODSTRANJEN HAL_Delay! Moramo takoj poslušati odgovor.
}

uint8_t ESP32_WaitResponse(char* expected, uint32_t timeout)
{
  uint32_t start = HAL_GetTick();
  esp_rx_index = 0;
  memset(esp_rx_buffer, 0, sizeof(esp_rx_buffer));

  while((HAL_GetTick() - start) < timeout)
  {
    if(HAL_UART_Receive(&huart1, &esp_rx_byte, 1, 10) == HAL_OK)
    {
      if(esp_rx_index < sizeof(esp_rx_buffer) - 1)
      {
        esp_rx_buffer[esp_rx_index++] = esp_rx_byte;
        esp_rx_buffer[esp_rx_index] = '\0'; // Null-terminate

        if(strstr((char*)esp_rx_buffer, expected) != NULL)
        {
          return 1; // Našli smo odgovor
        }
      }
    }
  }
  return 0; // Timeout
}

uint8_t ESP32_Init(void)
{
  // 1. Test AT komunikacije (3 poskusi)
  for(int i=0; i<3; i++) {
      ESP32_SendCommand("AT\r\n");
      if(ESP32_WaitResponse("OK", 500)) break; // Uspeh!
      if(i == 2) return 0; // 3x neuspeh -> VRNI NAPAKO (0)
      HAL_Delay(500);
  }

  // 2. Reset
  ESP32_SendCommand("AT+RST\r\n");
  HAL_Delay(3000); // Nujno čakanje na reboot

  // 3. Station Mode
  ESP32_SendCommand("AT+CWMODE=1\r\n");
  if(!ESP32_WaitResponse("OK", 1000)) return 0;

  return 1; // Vse OK
}

uint8_t ESP32_ConnectWiFi(void)
{
  char cmd[128];
  sprintf(cmd, "AT+CWJAP=\"%s\",\"%s\"\r\n", WIFI_SSID, WIFI_PASSWORD);
  ESP32_SendCommand(cmd);

  // Čakamo do 15 sekund na povezavo
  if(ESP32_WaitResponse("WIFI CONNECTED", 15000))
  {
    HAL_Delay(1000);
    // Pridobi IP (samo da preverimo, če je DHCP delal)
    ESP32_SendCommand("AT+CIFSR\r\n");
    ESP32_WaitResponse("OK", 2000);

    esp_ready = 1;
    return 1; // USPEH
  }

  esp_ready = 0;
  return 0; // NAPAKA
}

void ESP32_SendData(char* data)
{
  char cmd[128];
  uint16_t data_len = strlen(data);

  if(!esp_ready) return;

  // TCP povezava
  sprintf(cmd, "AT+CIPSTART=\"TCP\",\"%s\",%s\r\n", SERVER_IP, SERVER_PORT);
  ESP32_SendCommand(cmd);

  if(ESP32_WaitResponse("CONNECT", 2000))
  {
    // Priprava na pošiljanje
    sprintf(cmd, "AT+CIPSEND=%d\r\n", data_len);
    ESP32_SendCommand(cmd);

    if(ESP32_WaitResponse(">", 1000))
    {
      // Pošiljanje podatkov
      HAL_UART_Transmit(&huart1, (uint8_t*)data, data_len, 1000);
      ESP32_WaitResponse("SEND OK", 1000);
    }

    // Zapri povezavo (da ne zabašemo ESP-ja)
    ESP32_SendCommand("AT+CIPCLOSE\r\n");
    ESP32_WaitResponse("OK", 500); // Krajši timeout
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

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_SPI1_Init();
  MX_USB_DEVICE_Init();
  MX_USART1_UART_Init();
  /* USER CODE BEGIN 2 */

    HAL_Delay(2000); // Stabilizacija napajanja

    // 1. FAZA: RESET VSEH LUČK
    HAL_GPIO_WritePin(GPIOE, LD3_Pin|LD4_Pin|LD5_Pin|LD6_Pin|LD7_Pin|LD8_Pin|LD9_Pin|LD10_Pin, GPIO_PIN_RESET);

    // Prižgi RDEČO (LD3) - Pomeni: Začetek
    HAL_GPIO_WritePin(GPIOE, LD3_Pin, GPIO_PIN_SET);
    HAL_Delay(1000);

    // --- KORAK 1: ESP INITIALIZACIJA ---
    if(ESP32_Init() == 1)
    {
        // USPEH: Prižgi ORANŽNO (LD5)
        HAL_GPIO_WritePin(GPIOE, LD5_Pin, GPIO_PIN_SET);
    }
    else
    {
        // NAPAKA: Rdeča utripa v neskončnost
        while(1) {
            HAL_GPIO_TogglePin(GPIOE, LD3_Pin);
            HAL_Delay(200); // Hitro utripanje = ESP se ne odziva
        }
    }

    HAL_Delay(500);

    // --- KORAK 2: WIFI POVEZAVA ---
    if(ESP32_ConnectWiFi() == 1)
    {
        // USPEH: Ugasni Rdečo/Oranžno, Prižgi ZELENO (LD9)
        HAL_GPIO_WritePin(GPIOE, LD3_Pin|LD5_Pin, GPIO_PIN_RESET);
        HAL_GPIO_WritePin(GPIOE, LD9_Pin, GPIO_PIN_SET); // ZELENA = ZMAGA
    }
    else
    {
        // NAPAKA: Oranžna utripa v neskončnost
        while(1) {
            HAL_GPIO_TogglePin(GPIOE, LD5_Pin);
            HAL_Delay(500); // Počasno utripanje = WiFi napaka
        }
    }

    // Če pridemo do sem, gori ZELENA (LD9) in gremo v while zanko

    // Inicializacija senzorja (poskusimo, če dela)
    // LSM303DLHC_Init();

    /* USER CODE END 2 */

  /* Infinite loop */
    /* USER CODE BEGIN WHILE */

      uint32_t last_send = 0;

      while (1)
      {
        // Če senzor dela, odkomentiraj:
        // LSM303DLHC_Read_Accel();

        // Zaenkrat testni podatki, da vidimo če WiFi dela
        float acc_x_g = 0.11f;
        float acc_y_g = 0.22f;
        float acc_z_g = 0.99f;

        // Pošiljanje vsakih 200ms
        if(HAL_GetTick() - last_send > 200)
        {
          char wifi_data[128];
          // JSON format za strežnik
          sprintf(wifi_data, "{\"x\":%.2f,\"y\":%.2f,\"z\":%.2f}\n", acc_x_g, acc_y_g, acc_z_g);

          ESP32_SendData(wifi_data);

          // Utripni MODRO (LD4) ob vsakem pošiljanju - srčni utrip
          HAL_GPIO_TogglePin(GPIOE, LD4_Pin);

          last_send = HAL_GetTick();
        }

        // Ne uporabljaj prevelikih delayev v while zanki
        // HAL_Delay(10);

        /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
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

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI|RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL9;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK)
  {
    Error_Handler();
  }
  PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USB|RCC_PERIPHCLK_USART1
                              |RCC_PERIPHCLK_I2C1;
  PeriphClkInit.Usart1ClockSelection = RCC_USART1CLKSOURCE_PCLK2;
  PeriphClkInit.I2c1ClockSelection = RCC_I2C1CLKSOURCE_HSI;
  PeriphClkInit.USBClockSelection = RCC_USBCLKSOURCE_PLL_DIV1_5;
  if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief I2C1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_I2C1_Init(void)
{

  /* USER CODE BEGIN I2C1_Init 0 */

  /* USER CODE END I2C1_Init 0 */

  /* USER CODE BEGIN I2C1_Init 1 */

  /* USER CODE END I2C1_Init 1 */
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x00201D2B;
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

  /** Configure Analogue filter
  */
  if (HAL_I2CEx_ConfigAnalogFilter(&hi2c1, I2C_ANALOGFILTER_ENABLE) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Digital filter
  */
  if (HAL_I2CEx_ConfigDigitalFilter(&hi2c1, 0) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN I2C1_Init 2 */

  /* USER CODE END I2C1_Init 2 */

}

/**
  * @brief SPI1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_SPI1_Init(void)
{

  /* USER CODE BEGIN SPI1_Init 0 */

  /* USER CODE END SPI1_Init 0 */

  /* USER CODE BEGIN SPI1_Init 1 */

  /* USER CODE END SPI1_Init 1 */
  /* SPI1 parameter configuration*/
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
  /* USER CODE BEGIN SPI1_Init 2 */

  /* USER CODE END SPI1_Init 2 */

}

/**
  * @brief USART1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART1_UART_Init(void)
{

  /* USER CODE BEGIN USART1_Init 0 */

  /* USER CODE END USART1_Init 0 */

  /* USER CODE BEGIN USART1_Init 1 */

  /* USER CODE END USART1_Init 1 */
  huart1.Instance = USART1;
  huart1.Init.BaudRate = 9600;
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
  /* USER CODE BEGIN USART1_Init 2 */

  /* USER CODE END USART1_Init 2 */

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  /* USER CODE BEGIN MX_GPIO_Init_1 */

  /* USER CODE END MX_GPIO_Init_1 */

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

  /*Configure GPIO pin : B1_Pin */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /* USER CODE BEGIN MX_GPIO_Init_2 */

  /* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}
#ifdef USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
