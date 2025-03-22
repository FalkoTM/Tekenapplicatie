using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApp.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGeoJSONColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DrawingData",
                table: "Drawings",
                newName: "GeoJSON");

            migrationBuilder.RenameColumn(
                name: "DrawingData",
                table: "DeletedDrawings",
                newName: "GeoJSON");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GeoJSON",
                table: "Drawings",
                newName: "DrawingData");

            migrationBuilder.RenameColumn(
                name: "GeoJSON",
                table: "DeletedDrawings",
                newName: "DrawingData");
        }
    }
}
