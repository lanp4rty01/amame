<?xml version="1.0" encoding="UTF-8"?>
<!--
  AMAME layout file to svg, first pass
  jariseon 2018-08-11
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output encoding="UTF-8" method="text" indent="no"/>

  <xsl:template match="/mamelayout[@version='2']">
    {elements:[<xsl:apply-templates select="element"/>]
    ,views:[<xsl:apply-templates select="view"/>]}
  </xsl:template>
  
  <xsl:template match="element">
    {name:"<xsl:value-of select='@name'/>",      
      defstate:"<xsl:value-of select='@defstate'/>",
    items:[
    <xsl:for-each select="*">
      {tag:"<xsl:value-of select='name(.)'/>"
      <xsl:if test="@string">,string:"<xsl:value-of select='@string'/>"</xsl:if>
      <xsl:if test="@state">,state:"<xsl:value-of select='@state'/>"</xsl:if>
      <xsl:if test="bounds">,<xsl:apply-templates select="bounds"/></xsl:if>
      <xsl:if test="color">,<xsl:apply-templates select="color"/></xsl:if>}
      <xsl:if test="position() != last()">,</xsl:if>
    </xsl:for-each>]}
    <xsl:if test="position() != last()">,</xsl:if>
  </xsl:template>
  
  <xsl:template match="view">
    {name:"<xsl:value-of select='@name'/>", items:[
    <xsl:for-each select="*">
      {tag:"<xsl:value-of select='name(.)'/>",
        name:"<xsl:value-of select='@name'/>",
        element:"<xsl:value-of select='@element'/>"
      <xsl:if test="@inputtag">,inputtag:"<xsl:value-of select='@inputtag'/>"</xsl:if>
      <xsl:if test="@inputmask">,inputmask:"<xsl:value-of select='@inputmask'/>"</xsl:if>
      ,<xsl:apply-templates select="bounds"/>}
      <xsl:if test="position() != last()">,</xsl:if>
    </xsl:for-each>]}
    <xsl:if test="position() != last()">,</xsl:if>
  </xsl:template>
  
  <xsl:template match="bounds">
    bounds:{<xsl:choose>
    <xsl:when test="@left">left:<xsl:value-of select="@left"/>,top:<xsl:value-of select="@top"/>,right:<xsl:value-of select="@right"/>,bottom:<xsl:value-of select="@bottom"/>}</xsl:when>
    <xsl:when test="@x">x:<xsl:value-of select="@x"/>,y:<xsl:value-of select="@y"/>,width:<xsl:value-of select="@width"/>,height:<xsl:value-of select="@height"/>}</xsl:when>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template match="color">
    color:[
    <xsl:value-of select="round(@red * 255)"/>,
    <xsl:value-of select="round(@green * 255)"/>,
    <xsl:value-of select="round(@blue * 255)"/>]
  </xsl:template>
  
</xsl:stylesheet>
