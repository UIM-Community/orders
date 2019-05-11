CREATE DATABASE  IF NOT EXISTS `ca_uim_cmdb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `ca_uim_cmdb`;
-- MySQL dump 10.13  Distrib 8.0.13, for Win64 (x86_64)
--
-- Host: localhost    Database: ca_uim_cmdb
-- ------------------------------------------------------
-- Server version	8.0.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cmdb_bu`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_bu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `trigram` varchar(3) COLLATE utf8mb4_general_ci NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  UNIQUE KEY `trigram_UNIQUE` (`trigram`)
) ENGINE=InnoDB AUTO_INCREMENT=574 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - Business Applications';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_bu_attr`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_bu_attr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bu_id` int(11) NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_bu_id_idx` (`bu_id`),
  CONSTRAINT `FK_bu_id` FOREIGN KEY (`bu_id`) REFERENCES `cmdb_bu` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - Business Applications Attributes';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_cluster`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_cluster` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `type` int(11) NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - Cluster list and relationship table';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_device`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_device` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ip` varchar(15) COLLATE utf8mb4_general_ci NOT NULL,
  `cluster_id` int(11) DEFAULT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  KEY `FK_cluster_id_idx` (`cluster_id`),
  CONSTRAINT `FK_cluster_id` FOREIGN KEY (`cluster_id`) REFERENCES `cmdb_cluster` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - List of Devices';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_device_attr`
--

DROP TABLE IF EXISTS `cmdb_device_attr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_device_attr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_device_id_idx` (`device_id`),
  CONSTRAINT `FK_device_id` FOREIGN KEY (`device_id`) REFERENCES `cmdb_device` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - List of Devices Attributes';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_bu_device`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_bu_device` (
  `bu_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  KEY `FK_device_idx` (`device_id`),
  KEY `FK_bu_idx` (`bu_id`),
  CONSTRAINT `FK_bu` FOREIGN KEY (`bu_id`) REFERENCES `cmdb_bu` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_device` FOREIGN KEY (`device_id`) REFERENCES `cmdb_device` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - Pivot table between Business Applications and Devices';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_order`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` int(11) NOT NULL,
  `bu_id` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT '0',
  `last_update` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `number_UNIQUE` (`number`),
  KEY `FK_order_bu_id_idx` (`bu_id`),
  CONSTRAINT `FK_order_bu_id` FOREIGN KEY (`bu_id`) REFERENCES `cmdb_bu` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - Order list';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_order_action`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_order_action` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `condition` int(11) NOT NULL DEFAULT '0',
  `json` json NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_order_id_idx` (`order_id`),
  CONSTRAINT `FK_order_id` FOREIGN KEY (`order_id`) REFERENCES `cmdb_order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - List of Actions by Orders';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_subnet`
--

DROP TABLE IF EXISTS `cmdb_subnet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_subnet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(15) COLLATE utf8mb4_general_ci NOT NULL,
  `ip_bin` varbinary(16) NOT NULL,
  `mask` varchar(15) COLLATE utf8mb4_general_ci NOT NULL,
  `mask_bin` varbinary(16) NOT NULL,
  `mask_bit` tinyint(4) NOT NULL,
  `broadcast` varchar(15) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `broadcast_bin` varbinary(16) DEFAULT NULL,
  `fist_ip` varchar(15) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_ip` varchar(15) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `first_ip_bin` varbinary(16) DEFAULT NULL,
  `last_ip_bin` varbinary(16) DEFAULT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - List of Subnets';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_vlan`
--

DROP TABLE IF EXISTS `cmdb_vlan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_vlan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` int(11) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - List of VLANs';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_subnet_vlan`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_subnet_vlan` (
  `subnet_id` int(11) NOT NULL,
  `vlan_id` int(11) NOT NULL,
  KEY `FK_vlan_id_idx` (`vlan_id`),
  KEY `FK_subnet_id_idx` (`subnet_id`),
  CONSTRAINT `FK_subnet` FOREIGN KEY (`subnet_id`) REFERENCES `cmdb_subnet` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_vlan` FOREIGN KEY (`vlan_id`) REFERENCES `cmdb_vlan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - Pivot table between VLANs and Subnets';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_ip_addr`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_ip_addr` (
  `device_id` int(11) DEFAULT NULL,
  `subnet_id` int(11) NOT NULL,
  `ip_addr` varchar(15) COLLATE utf8mb4_general_ci NOT NULL,
  `ip_addr_bin` varbinary(16) NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `FK_device_id_ip_addr_idx` (`device_id`),
  KEY `FK_ip_addr_subnet_id_idx` (`subnet_id`),
  CONSTRAINT `FK_ip_addr_device_id` FOREIGN KEY (`device_id`) REFERENCES `cmdb_device` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_ip_addr_subnet_id` FOREIGN KEY (`subnet_id`) REFERENCES `cmdb_subnet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - Pivot table between Devices and Subnets';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cmdb_vlan_attr`
--

DROP TABLE IF EXISTS `cmdb_vlan_attr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `cmdb_vlan_attr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vlan_id` int(11) NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_vlan_id_idx` (`vlan_id`),
  CONSTRAINT `FK_vlan_id` FOREIGN KEY (`vlan_id`) REFERENCES `cmdb_vlan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='CMDB - List of VLANs Attributes';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `cmdb_sql1`
--

/*!50001 DROP VIEW IF EXISTS `cmdb_sql1`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`::1` SQL SECURITY DEFINER */
/*!50001 VIEW `cmdb_sql1` AS select `ca_uim_cmdb`.`cmdb_rowid`(1) AS `id`,concat_ws('#',`sql1`.`trigram`,`sql1`.`order`,`sql1`.`condition`) AS `sql1`,`sql1`.`trigram` AS `trigram`,`sql1`.`order` AS `order`,`sql1`.`condition` AS `condition`,`sql1`.`json` AS `json` from ((select `cmdb_bu`.`trigram` AS `trigram`,`cmdb_order`.`number` AS `order`,`cmdb_order_action`.`condition` AS `condition`,`cmdb_order_action`.`json` AS `json` from ((`cmdb_bu` join `cmdb_order` on((`cmdb_order`.`bu_id` = `cmdb_bu`.`id`))) join `cmdb_order_action` on((`cmdb_order_action`.`order_id` = `cmdb_order`.`id`)))) `sql1` join (select `cmdb_rowid`(0) AS `cmdb_rowid(0)`) `init`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
